import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.ts";
import ReportCard from "../models/ReportCard.ts";
import Class from "../models/class.ts";
import User from "../models/user.ts";
import Submission from "../models/submission.ts";
import Attendance from "../models/Attendance.ts";
import AcademicYear from "../models/academicYear.ts";
import { logActivity } from "../utils/activitieslog.ts";

function scoreToGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function gradeRemarks(grade: string): string {
  switch (grade) {
    case "A+": return "Excellent";
    case "A": return "Very Good";
    case "B": return "Good";
    case "C": return "Satisfactory";
    case "D": return "Needs Improvement";
    default: return "Unsatisfactory";
  }
}

// @desc  Generate report cards for all students in a class
// @route POST /api/report-cards/generate
export const triggerReportGeneration = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, term } = req.body;
    if (!classId || !term) return res.status(400).json({ message: "classId and term are required" });

    const classData = await Class.findById(classId).populate("students subjects");
    if (!classData) return res.status(404).json({ message: "Class not found" });

    const students = classData.students as any[];
    const subjects = classData.subjects as any[];

    const generated: string[] = [];

    for (const student of students) {
      const submissions = await Submission.find({ student: student._id })
        .populate({ path: "exam", select: "subject questions", populate: { path: "subject", select: "name" } })
        .lean();

      const subjectScores: Record<string, number[]> = {};
      for (const sub of submissions) {
        const subjectName = (sub.exam as any)?.subject?.name || "General";
        const totalPts = ((sub.exam as any)?.questions ?? []).reduce((s: number, q: any) => s + (q.points || 1), 0) || 1;
        const pct = Math.round(((sub.score || 0) / totalPts) * 100);
        if (!subjectScores[subjectName]) subjectScores[subjectName] = [];
        subjectScores[subjectName].push(pct);
      }

      const attendanceRecords = await Attendance.find({ student: student._id, class: classId }).lean();
      const presentCount = attendanceRecords.filter((r: any) => r.status === "present").length;
      const attendancePct = attendanceRecords.length ? Math.round((presentCount / attendanceRecords.length) * 100) : 0;

      const results = subjects.map((subject: any) => {
        const scores = subjectScores[subject.name] ?? [];
        if (!scores.length) {
          return { subjectName: subject.name, score: null, grade: "N/A", remarks: "No exam taken" };
        }
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const grade = scoreToGrade(avg);
        return { subjectName: subject.name, score: avg, grade, remarks: gradeRemarks(grade) };
      });

      const attempted = results.filter((r) => r.score !== null);
      const totalScore = attempted.reduce((s, r) => s + (r.score as number), 0);
      const averageScore = attempted.length ? Math.round(totalScore / attempted.length) : 0;

      await ReportCard.findOneAndUpdate(
        { student: student._id, term },
        { class: classId, results, totalScore, averageScore, attendance: attendancePct, teacherComment: averageScore >= 70 ? "Keep up the good work!" : "More effort needed.", generatedAt: new Date() },
        { upsert: true, new: true }
      );
      generated.push(student._id.toString());
    }

    await logActivity({ userId: req.user!._id.toString(), action: `Generated ${generated.length} report cards for term ${term}` });
    res.json({ message: `Generated ${generated.length} report cards for term "${term}"` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get logged-in student's report cards
// @route GET /api/report-cards
export const getMyReports = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await ReportCard.find({ student: req.user!._id }).sort({ generatedAt: -1 });
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get report cards for a class (admin/teacher)
// @route GET /api/report-cards/class/:classId
export const getClassReports = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const { term } = req.query;
    const query: any = { class: classId };
    if (term) query.term = term;
    const reports = await ReportCard.find(query).populate("student", "name email").sort({ generatedAt: -1 });
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
