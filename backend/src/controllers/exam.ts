import { type Request, type Response } from "express";
import mongoose from "mongoose";
import { generateText } from "ai";
import { logActivity } from "../utils/activitieslog.ts";
import Class from "../models/class.ts";
import Exam, { type IQuestion } from "../models/exam.ts";
import Subject from "../models/subject.ts";
import Submission from "../models/submission.ts";
import User from "../models/user.ts";
import { getGeminiModel } from "../config/geminiModel.ts";
import type { AuthRequest } from "../middleware/auth.ts";

function parseQuestionsArray(text: string): unknown[] {
  const stripped = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { questions?: unknown }).questions)) {
      return (parsed as { questions: unknown[] }).questions;
    }
  } catch { /* try bracket slice */ }
  const start = stripped.indexOf("[");
  const end = stripped.lastIndexOf("]");
  if (start >= 0 && end > start) return JSON.parse(stripped.slice(start, end + 1)) as unknown[];
  throw new Error("The model did not return valid JSON. Try again or reduce question count.");
}

// @desc    Generate AI Exam (direct Gemini call — no Inngest required)
// @route   POST /api/exams/generate
export const triggerExamGeneration = async (req: Request, res: Response) => {
  try {
    const {
      title,
      subject,
      class: classId,
      duration,
      dueDate,
      topic,
      difficulty,
      count,
    } = req.body;

    const topicStr = typeof topic === "string" ? topic.trim() : "";
    if (!topicStr) return res.status(400).json({ message: "topic is required" });
    if (!subject || !classId || !mongoose.isValidObjectId(subject) || !mongoose.isValidObjectId(classId)) {
      return res.status(400).json({ message: "Valid subject and class ids are required" });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return res.status(503).json({ message: "GOOGLE_GENERATIVE_AI_API_KEY is not set." });

    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) return res.status(404).json({ message: "Subject not found" });
    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(400).json({ message: "Class not found" });

    const n = Math.min(50, Math.max(1, Number(count) || 10));
    const diff = difficulty || "Medium";

    const prompt = `You are a strict teacher. Create exactly ${n} multiple-choice questions for a high school exam.

CONTEXT:
- Subject: ${subjectDoc.name}
- Topic: ${topicStr}
- Difficulty: ${diff}

STRICT JSON SCHEMA (array only, no markdown):
[
  {
    "questionText": "Question string",
    "type": "MCQ",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The exact string of the correct option",
    "points": 1
  }
]

RULES:
1. Output ONLY valid JSON array. No markdown fences.
2. correctAnswer must equal one of the options exactly.`;

    const { text } = await generateText({
      model: getGeminiModel(apiKey),
      prompt,
      maxRetries: 0,
      maxOutputTokens: 8192,
    });

    const questions = parseQuestionsArray(text) as IQuestion[];

    const teacherId = String((req as any).user._id);
    const exam = await Exam.create({
      title: title?.trim() || `AI Exam: ${topicStr}`,
      subject,
      class: classId,
      teacher: teacherId,
      duration: duration || 60,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: false,
      questions,
    });

    await logActivity({ userId: teacherId, action: `User generated AI exam: ${String(exam._id)}` });

    res.status(201).json({
      message: `Exam created with ${questions.length} questions. Review and publish when ready.`,
      examId: String(exam._id),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server Error";
    res.status(500).json({ message: msg });
  }
};

// @desc    Create/Publish Exam we won't use it
// @route   POST /api/exams
export const createExam = async (req: Request, res: Response) => {
  try {
    const exam = await Exam.create({
      ...req.body,
      teacher: (req as any).user._id, // From Auth Middleware
    });
    const userId = (req as any).user._id;
    await logActivity({ userId, action: "User created a new exam" });
    res.status(201).json(exam);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    List graded submissions for the logged-in student
// @route   GET /api/exams/my-results
export const getMyExamResults = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== "student") {
      return res.status(403).json({ message: "Only students can access this resource" });
    }
    const subs = await Submission.find({ student: user._id })
      .populate({
        path: "exam",
        select: "title dueDate questions.points",
      })
      .sort({ submittedAt: -1 })
      .limit(40)
      .lean();

    const rows = subs.map((s) => {
      const ex = s.exam as { title?: string; dueDate?: Date; questions?: { points?: number }[] } | null;
      const maxScore = Array.isArray(ex?.questions)
        ? ex!.questions!.reduce((sum, q) => sum + (q.points ?? 1), 0)
        : 0;
      return {
        _id: s._id,
        score: s.score,
        maxScore,
        submittedAt: s.submittedAt,
        examTitle: ex?.title ?? "Exam",
        examDue: ex?.dueDate,
      };
    });

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    List a child's exam results for a parent
// @route   GET /api/exams/child/:id/results
// @access  Private/Parent
export const getChildExamResults = async (req: AuthRequest, res: Response) => {
  try {
    const parent = req.user!;
    const childId = req.params.id;

    const parentDoc = await User.findById(parent._id).select("children").lean();
    const childIds = ((parentDoc as any)?.children ?? []).map(String);
    if (!childIds.includes(childId)) {
      return res.status(403).json({ message: "This student is not linked to your account" });
    }

    const subs = await Submission.find({ student: childId })
      .populate({ path: "exam", select: "title dueDate questions subject", populate: { path: "subject", select: "name" } })
      .sort({ submittedAt: -1 })
      .limit(40)
      .lean();

    const rows = subs.map((s) => {
      const ex = s.exam as { title?: string; dueDate?: Date; questions?: { points?: number }[]; subject?: { name?: string } | string } | null;
      const maxScore = Array.isArray(ex?.questions)
        ? ex!.questions!.reduce((sum, q) => sum + (q.points ?? 1), 0)
        : 0;
      const subjectName = ex?.subject && typeof ex.subject === "object" ? (ex.subject as any).name : null;
      return {
        _id: s._id,
        score: s.score,
        maxScore,
        percentage: maxScore > 0 ? Math.round((s.score / maxScore) * 100) : 0,
        submittedAt: s.submittedAt,
        examTitle: ex?.title ?? "Exam",
        examDue: ex?.dueDate,
        subject: subjectName,
      };
    });

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Exams (Student sees available, Teacher sees created)
// @route   GET /api/exams
export const getExams = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let query = {};

    if (user.role === "student") {
      query = { class: user.studentClass, isActive: true };
    } else if (user.role === "teacher") {
      query = { teacher: user._id };
    } else if (user.role === "admin") {
      query = {};
    }

    const exams = await Exam.find(query)
      .populate("subject", "name")
      .populate("class", "name section")
      .select("-questions.correctAnswer"); // Hide answers!

    res.json(exams);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get exam by id
// @route   POST /api/exams/:id
export const getExamById = async (req: Request, res: Response) => {
  try {
    const examId = req.params.id;
    const user = (req as any).user; // Assumes authMiddleware attaches user

    // 1. Initialize the query
    let query = Exam.findById(examId)
      .populate("subject", "name code")
      .populate("class", "name section")
      .populate("teacher", "name email");

    // 2. Conditional Logic: Reveal answers for Teachers/Admins
    // The '+' syntax forces selection of fields marked as { select: false } in Schema
    if (user.role === "teacher" || user.role === "admin") {
      // @ts-ignore
      query = query.select("+questions.correctAnswer");
    }

    // 3. Execute Query
    const exam = await query;

    // 4. Handle Not Found
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // 5. Security Check (Optional but recommended)
    // Ensure student belongs to the class this exam is assigned to
    if (user.role === "student") {
      const examClassId = exam.class._id
        ? exam.class._id.toString()
        : exam.class.toString();
      const userClassId = user.studentClass ? user.studentClass.toString() : "";

      if (examClassId !== userClassId) {
        return res
          .status(403)
          .json({ message: "You are not authorized to view this exam." });
      }
    }

    if (user.role === "teacher") {
      const t = exam.teacher as { _id?: { toString: () => string } };
      const ownerId =
        t && typeof t === "object" && t._id
          ? t._id.toString()
          : String(exam.teacher);
      if (ownerId !== user._id.toString()) {
        return res
          .status(403)
          .json({ message: "You are not authorized to view this exam." });
      }
    }

    res.json(exam.toObject({ virtuals: true }));
  } catch (error: any) {
    console.error(error);

    // Handle Invalid ID format (CastError)
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid exam ID" });
    }

    // Handle other errors
    return res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Toggle Exam Status (Active/Inactive)
// @route   PATCH /api/exams/:id/status
// @access  Private (Teacher/Admin)
export const toggleExamStatus = async (req: Request, res: Response) => {
  try {
    const examId = req.params.id;
    const user = (req as any).user;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Security Check: Ensure the user owns the exam (if not Admin)
    if (
      user.role !== "admin" &&
      exam.teacher.toString() !== user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify this exam" });
    }

    // Toggle the status
    exam.isActive = !exam.isActive;
    await exam.save();
    const userId = (req as any).user._id;
    await logActivity({ userId, action: "User toggled exam status" });
    res.json({
      message: `Exam is now ${exam.isActive ? "Active" : "Inactive"}`,
      _id: exam._id,
      isActive: exam.isActive,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit & Auto-Grade Exam
// @route   POST /api/exams/:id/submit
export const submitExam = async (req: Request, res: Response) => {
  try {
    const { answers } = req.body;
    const studentId = (req as any).user._id;
    const rawExamId = req.params.id;
    const examId = Array.isArray(rawExamId) ? rawExamId[0] : rawExamId;
    if (!examId || typeof examId !== "string") {
      return res.status(400).json({ message: "Invalid exam id" });
    }

    const existing = await Submission.findOne({ exam: examId, student: studentId });
    if (existing) {
      return res.status(400).json({ message: "You have already submitted this exam." });
    }

    const exam = await Exam.findById(examId).select("+questions.correctAnswer");
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const answerMap = new Map(
      (answers as { questionId: string; answer: string }[]).map((a) => [a.questionId, a.answer])
    );
    let score = 0;
    for (const q of exam.questions) {
      const given = answerMap.get(String((q as { _id?: unknown })._id));
      if (given !== undefined && given === (q as { correctAnswer?: string }).correctAnswer) {
        score += (q as { points?: number }).points ?? 1;
      }
    }

    await Submission.create({
      exam: examId,
      student: studentId,
      answers,
      score,
      submittedAt: new Date(),
    });
    await logActivity({ userId: studentId, action: "User submitted an exam" });
    return res.status(201).json({
      message: "Exam submitted and graded.",
      score,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Exam Results (For Student)
// @route   GET /api/exams/:id/result
export const getExamResult = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user._id;
    const examId = req.params.id;

    const submission = await Submission.findOne({
      exam: examId,
      student: studentId,
    }).populate({
      path: "exam",
      select: "title questions._id questions.correctAnswer", // <--- FORCE SELECT correct answers
    });
    if (!submission) {
      return res.status(404).json({ message: "No submission found" });
    }

    res.json(submission);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all student submissions for an exam (teacher/admin view)
// @route   GET /api/exams/:id/submissions
export const getExamSubmissions = async (req: Request, res: Response) => {
  try {
    const exam = await Exam.findById(req.params.id).select("questions");
    const totalPoints = exam
      ? (exam.questions as any[]).reduce((sum: number, q: any) => sum + (q.points ?? 1), 0)
      : null;

    const submissions = await Submission.find({ exam: req.params.id })
      .populate("student", "name email")
      .sort({ submittedAt: -1 })
      .lean();

    res.json({ submissions: submissions.map((s) => ({ ...s, totalPoints })) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an exam (and its submissions)
// @route   DELETE /api/exams/:id
// @access  Private (Teacher owns it, or Admin)
export const deleteExam = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    if (user.role !== "admin" && exam.teacher.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this exam" });
    }

    await Submission.deleteMany({ exam: exam._id });
    await exam.deleteOne();
    await logActivity({ userId: user._id, action: `Deleted exam: ${exam.title}` });

    res.json({ message: "Exam deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};