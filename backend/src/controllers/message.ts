import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.ts";
import Message from "../models/message.ts";
import User from "../models/user.ts";

// @desc    Send a message from teacher to a parent (about a student)
// @route   POST /api/messages
// @access  Private/Teacher+Admin
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, subject, body } = req.body;
    if (!studentId || !subject?.trim() || !body?.trim()) {
      return res.status(400).json({ message: "studentId, subject and body are required" });
    }

    // Find parent(s) linked to this student
    const parents = await User.find({ role: "parent", children: studentId }, "_id name").lean();
    if (!parents.length) {
      return res.status(404).json({ message: "No parent is linked to this student. Ask an admin to link a parent first." });
    }

    // Send to all linked parents
    const messages = await Message.insertMany(
      parents.map((p) => ({
        from: req.user!._id,
        to: p._id,
        student: studentId,
        subject: subject.trim(),
        body: body.trim(),
      }))
    );

    res.status(201).json({ message: "Message sent", count: messages.length, sentTo: parents.map((p) => p.name) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get parent's inbox
// @route   GET /api/messages/inbox
// @access  Private/Parent
export const getInbox = async (req: AuthRequest, res: Response) => {
  try {
    const msgs = await Message.find({ to: req.user!._id })
      .populate("from", "name")
      .populate("student", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json(
      msgs.map((m) => ({
        _id: m._id,
        subject: m.subject,
        body: m.body,
        read: m.read,
        createdAt: m.createdAt,
        from: (m.from as any)?.name ?? "Teacher",
        studentName: (m.student as any)?.name ?? "Student",
      }))
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get teacher's sent messages
// @route   GET /api/messages/sent
// @access  Private/Teacher+Admin
export const getSent = async (req: AuthRequest, res: Response) => {
  try {
    const msgs = await Message.find({ from: req.user!._id })
      .populate("to", "name")
      .populate("student", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json(
      msgs.map((m) => ({
        _id: m._id,
        subject: m.subject,
        body: m.body,
        read: m.read,
        createdAt: m.createdAt,
        to: (m.to as any)?.name ?? "Parent",
        studentName: (m.student as any)?.name ?? "Student",
      }))
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private/Parent
export const markRead = async (req: AuthRequest, res: Response) => {
  try {
    const msg = await Message.findOneAndUpdate(
      { _id: req.params.id, to: req.user!._id },
      { read: true },
      { new: true }
    );
    if (!msg) return res.status(404).json({ message: "Message not found" });
    res.json({ message: "Marked as read" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get students the teacher can message (their class students)
// @route   GET /api/messages/my-students
// @access  Private/Teacher+Admin
export const getMyStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { default: Class } = await import("../models/class.ts");
    const query = req.user!.role === "teacher" ? { classTeacher: req.user!._id } : {};
    const classes = await Class.find(query).populate("students", "name").lean();

    const seen = new Set<string>();
    const students: { _id: string; name: string; className: string }[] = [];
    for (const cls of classes) {
      for (const s of (cls.students ?? []) as any[]) {
        if (!seen.has(String(s._id))) {
          seen.add(String(s._id));
          students.push({ _id: s._id, name: s.name, className: cls.name });
        }
      }
    }
    res.json({ students });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
