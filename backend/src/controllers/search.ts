import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.ts";
import User from "../models/user.ts";
import Class from "../models/class.ts";
import Subject from "../models/subject.ts";
import Exam from "../models/exam.ts";

export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) return res.json([]);

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");

    const [students, teachers, classes, subjects, exams] = await Promise.all([
      User.find({ role: "student", $or: [{ name: regex }, { email: regex }] }).select("name email role").limit(5),
      User.find({ role: "teacher", $or: [{ name: regex }, { email: regex }] }).select("name email role").limit(5),
      Class.find({ name: regex }).select("name").limit(5),
      Subject.find({ $or: [{ name: regex }, { code: regex }] }).select("name code").limit(5),
      Exam.find({ title: regex }).select("title dueDate").limit(5),
    ]);

    res.json([
      ...students.map((s) => ({ id: s._id, title: s.name, subtitle: s.email, type: "student", url: "/app/admin/users" })),
      ...teachers.map((t) => ({ id: t._id, title: t.name, subtitle: t.email, type: "teacher", url: "/app/admin/users" })),
      ...classes.map((c) => ({ id: c._id, title: c.name, subtitle: "Class", type: "class", url: "/app/admin/classes" })),
      ...subjects.map((s) => ({ id: s._id, title: `${s.name} (${s.code})`, subtitle: "Subject", type: "subject", url: "/app/admin/subjects" })),
      ...exams.map((e) => ({ id: e._id, title: e.title, subtitle: `Exam · ${new Date(e.dueDate).toLocaleDateString()}`, type: "exam", url: `/app/teacher/exams` })),
    ]);
  } catch (error: any) {
    res.status(500).json({ message: "Search failed" });
  }
};
