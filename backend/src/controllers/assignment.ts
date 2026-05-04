import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.ts";
import Assignment from "../models/assignment.ts";
import { logActivity } from "../utils/activitieslog.ts";

export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { title, description, subject, class: classId, dueDate } = req.body;

    if (!title || !description || !subject || !classId || !dueDate)
      return res.status(400).json({ message: "All fields are required" });

    const assignment = await Assignment.create({ title, description, subject, class: classId, teacher: userId, dueDate });
    await logActivity({ userId: userId.toString(), action: `Created assignment: ${title}` });
    res.status(201).json({ assignment });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const classId = req.query.classId as string;

    const query: any = {};
    if (user.role === "teacher") query.teacher = user._id;
    if (user.role === "student" && user.studentClass) query.class = user.studentClass;
    if (classId) query.class = classId;

    const [total, assignments] = await Promise.all([
      Assignment.countDocuments(query),
      Assignment.find(query)
        .populate("subject", "name code")
        .populate("class", "name")
        .populate("teacher", "name email")
        .sort({ dueDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.json({ assignments, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    await logActivity({ userId: req.user!._id.toString(), action: `Updated assignment: ${assignment.title}` });
    res.json({ assignment });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    await logActivity({ userId: req.user!._id.toString(), action: `Deleted assignment: ${assignment.title}` });
    res.json({ message: "Assignment deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
