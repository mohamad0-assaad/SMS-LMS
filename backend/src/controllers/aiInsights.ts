import type { Response } from "express";
import { generateText } from "ai";
import type { AuthRequest } from "../middleware/auth.ts";
import { getGeminiModel } from "../config/geminiModel.ts";
import Class from "../models/class.ts";
import Subject from "../models/subject.ts";
import Submission from "../models/submission.ts";
import Attendance from "../models/Attendance.ts";
import Exam from "../models/exam.ts";

/** No retries: quota/rate errors should not be retried (avoids “Failed after 3 attempts”). */
const AI_CALL = { maxRetries: 0 as const };

function isGeminiQuotaError(message: string): boolean {
  return (
    /quota|rate limit|RESOURCE_EXHAUSTED|exceeded your current quota|free_tier/i.test(
      message,
    ) || message.includes("generativelanguage.googleapis.com")
  );
}

function respondGeminiFailure(res: Response, err: unknown) {
  const raw = err instanceof Error ? err.message : String(err);
  if (isGeminiQuotaError(raw)) {
    return res.status(429).json({
      code: "GEMINI_QUOTA",
      message:
        "Google Gemini quota or free-tier limit reached for this API key. " +
        "Open Google AI Studio → your API key / billing, enable billing or wait for the daily reset. " +
        "Docs: https://ai.google.dev/gemini-api/docs/rate-limits",
    });
  }
  console.error("[ai]", err);
  return res.status(500).json({ message: raw });
}

function requireGeminiKey(res: Response): string | null {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    res.status(503).json({
      message:
        "GOOGLE_GENERATIVE_AI_API_KEY is not set. Add it to backend .env for AI features.",
    });
    return null;
  }
  return key;
}

/** Gemini often wraps JSON or adds prose; extract and parse a JSON array safely. */
function parseQuestionsArray(text: string): unknown {
  const stripped = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { questions?: unknown }).questions)) {
      return (parsed as { questions: unknown[] }).questions;
    }
  } catch {
    /* try bracket slice */
  }
  const start = stripped.indexOf("[");
  const end = stripped.lastIndexOf("]");
  if (start >= 0 && end > start) {
    return JSON.parse(stripped.slice(start, end + 1));
  }
  throw new Error(
    "The model did not return valid JSON. Try again, or shorten the number of questions.",
  );
}

/** POST /api/ai/ask */
export const aiAsk = async (req: AuthRequest, res: Response) => {
  try {
    const apiKey = requireGeminiKey(res);
    if (!apiKey) return;

    const { prompt } = req.body as { prompt?: string };
    if (!prompt?.trim()) {
      return res.status(400).json({ message: "prompt is required" });
    }

    const user = req.user!;
    let systemContext = "";

    // Build rich context for students
    if (user.role === "student") {
      try {
        const studentClassId = (user as any).studentClass;

        // Get class + subjects
        let className = "";
        let subjectNames: string[] = [];
        if (studentClassId) {
          const cls = await Class.findById(studentClassId)
            .populate("subjects", "name")
            .lean();
          if (cls) {
            className = cls.name;
            subjectNames = ((cls as any).subjects ?? []).map(
              (s: any) => s.name ?? s
            );
          }
        }

        // Get per-subject performance from exam submissions
        const subs = await Submission.find({ student: user._id })
          .populate({
            path: "exam",
            select: "questions subject",
            populate: { path: "subject", select: "name" },
          })
          .lean();

        const subjectMap = new Map<string, { scores: number[] }>();
        for (const sub of subs) {
          const ex = sub.exam as any;
          const maxScore = Array.isArray(ex?.questions)
            ? ex.questions.reduce(
                (s: number, q: any) => s + (q.points ?? 1),
                0
              )
            : 0;
          if (maxScore <= 0) continue;
          const subjName =
            typeof ex?.subject === "object"
              ? ex.subject?.name
              : ex?.subject;
          if (!subjName) continue;
          if (!subjectMap.has(subjName))
            subjectMap.set(subjName, { scores: [] });
          subjectMap
            .get(subjName)!
            .scores.push(Math.round((sub.score / maxScore) * 100));
        }

        const subjectScores = [...subjectMap.entries()]
          .map(([name, { scores }]) => ({
            name,
            avg: Math.round(
              scores.reduce((a, b) => a + b, 0) / scores.length
            ),
          }))
          .sort((a, b) => a.avg - b.avg);

        const weakest = subjectScores[0] ?? null;
        const strongest = subjectScores[subjectScores.length - 1] ?? null;

        // Attendance
        const attRecords = await Attendance.find({ student: user._id }).lean();
        const attPct =
          attRecords.length > 0
            ? Math.round(
                (attRecords.filter(
                  (r) => r.status === "present" || r.status === "late"
                ).length /
                  attRecords.length) *
                  100
              )
            : null;

        // Total exams taken vs available
        let courseProgress: string | null = null;
        if (studentClassId) {
          const totalExams = await Exam.countDocuments({
            class: studentClassId,
            isActive: true,
          });
          if (totalExams > 0) {
            const taken = Math.min(subs.length, totalExams);
            courseProgress = `${taken}/${totalExams} exams completed (${Math.round((taken / totalExams) * 100)}%)`;
          }
        }

        const subjectBreakdown =
          subjectScores.length > 0
            ? subjectScores
                .map((s) => `  • ${s.name}: ${s.avg}% avg`)
                .join("\n")
            : "  No exam data yet.";

        systemContext = `
You are a personalized AI Study Coach for ${user.name}, a student at this school.

STUDENT PROFILE:
- Name: ${user.name}
- Class: ${className || "Not assigned yet"}
- Subjects: ${subjectNames.length > 0 ? subjectNames.join(", ") : "Not assigned yet"}
- Attendance rate: ${attPct !== null ? `${attPct}%` : "No data"}
- Course progress: ${courseProgress ?? "No data"}

EXAM PERFORMANCE BY SUBJECT (lowest = needs most attention):
${subjectBreakdown}

INSIGHTS:
- Weakest subject: ${weakest ? `${weakest.name} (${weakest.avg}% avg) — focus here first` : "Not enough data yet"}
- Strongest subject: ${strongest && strongest !== weakest ? `${strongest.name} (${strongest.avg}% avg)` : "Not enough data yet"}

COACHING RULES:
1. Always be specific to this student's actual subjects and performance when relevant.
2. If they ask about a topic, relate it to their weakest subject when applicable.
3. Give concrete, actionable advice — not generic tips.
4. If they ask what to study, prioritize their weakest subject.
5. Be encouraging but honest about where they need improvement.
6. Keep answers focused and concise (no unnecessary padding).
`.trim();
      } catch {
        // If context fetch fails, continue with basic prompt
      }
    } else {
      systemContext =
        "You are a helpful teaching assistant for a school LMS. Be concise and practical.";
    }

    const fullPrompt = systemContext
      ? `${systemContext}\n\nStudent question:\n${prompt.trim()}`
      : `You are a helpful school assistant.\n\nQuestion:\n${prompt.trim()}`;

    const { text } = await generateText({
      ...AI_CALL,
      model: getGeminiModel(apiKey),
      prompt: fullPrompt,
    });

    res.json({ answer: text });
  } catch (e: unknown) {
    respondGeminiFailure(res, e);
  }
};

/** POST /api/ai/recommend */
export const aiRecommend = async (req: AuthRequest, res: Response) => {
  try {
    const apiKey = requireGeminiKey(res);
    if (!apiKey) return;

    const { topic, strategy, risk } = req.body as {
      topic?: string;
      strategy?: string;
      risk?: number;
    };
    if (!topic?.trim()) {
      return res.status(400).json({ message: "topic is required" });
    }

    const { text } = await generateText({
      ...AI_CALL,
      model: getGeminiModel(apiKey),
      prompt: `You are a learning strategist for students.

Topic: ${topic.trim()}
Preferred study approach: ${strategy ?? "mixed"}
Risk / difficulty focus (0 = foundational, 1 = stretch): ${risk ?? 0}

Give a short recommendation: 3–5 bullet points with concrete next steps. Plain text only.`,
    });

    res.json({ recommendation: text });
  } catch (e: unknown) {
    respondGeminiFailure(res, e);
  }
};

/** POST /api/ai/generate-class-quiz */
export const aiGenerateClassQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const apiKey = requireGeminiKey(res);
    if (!apiKey) return;

    const { classId, subjectId, count } = req.body as {
      classId?: string;
      subjectId?: string;
      count?: number;
    };
    if (!classId || !subjectId) {
      return res.status(400).json({ message: "classId and subjectId are required" });
    }

    const n = Math.min(20, Math.max(3, Number(count) || 5));

    const cls = await Class.findById(classId);
    const subject = await Subject.findById(subjectId);

    if (!cls || !subject) {
      return res.status(404).json({ message: "Class or subject not found" });
    }

    const subjectInClass = (cls.subjects ?? []).some(
      (id) => id.toString() === subjectId
    );
    const subjectWarning =
      !subjectInClass && (cls.subjects?.length ?? 0) > 0
        ? "This subject is not linked to the class in the database; the quiz was still generated from the class and subject names you chose."
        : !subjectInClass && (cls.subjects?.length ?? 0) === 0
          ? "This class has no subjects listed in the database; the quiz was generated from the class and subject names only."
          : undefined;

    const prompt = `
You are an experienced teacher. Create exactly ${n} multiple-choice questions for a class quiz.

CONTEXT:
- Class: ${cls.name}
- Subject: ${subject.name} (${subject.code})
- Student count in class: ${(cls.students ?? []).length}

STRICT JSON SCHEMA (array only, no markdown):
[
  {
    "questionText": "string",
    "type": "MCQ",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "exact string matching one option",
    "points": 1
  }
]

RULES:
1. Output ONLY valid JSON array. No markdown fences.
2. Questions should match typical level for this class name.
3. correctAnswer must equal one of the options exactly.
`;

    const { text } = await generateText({
      ...AI_CALL,
      model: getGeminiModel(apiKey),
      prompt,
      maxOutputTokens: 8192,
    });

    const questions = parseQuestionsArray(text) as unknown;
    res.json({
      classId,
      subjectId,
      className: cls.name,
      subjectName: subject.name,
      questions,
      ...(subjectWarning ? { warning: subjectWarning } : {}),
    });
  } catch (e: unknown) {
    respondGeminiFailure(res, e);
  }
};
