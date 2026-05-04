import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.ts";
import Fee from "../models/Fee.ts";
import User from "../models/user.ts";
import { logActivity } from "../utils/activitieslog.ts";

export const createFee = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { student, class: classId, amount, dueDate, description } = req.body;
    if (!student || !amount || !dueDate)
      return res.status(400).json({ message: "student, amount, and dueDate are required" });

    const fee = await Fee.create({ student, class: classId, amount, paidAmount: 0, balance: amount, dueDate, description, createdBy: userId });
    await logActivity({ userId: userId.toString(), action: `Created fee record for student` });
    res.status(201).json({ fee });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkCreateFees = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { classId, amount, dueDate, description } = req.body;
    if (!classId || !amount || !dueDate)
      return res.status(400).json({ message: "classId, amount, and dueDate are required" });

    const students = await User.find({ role: "student", studentClass: classId }).select("_id");
    if (!students.length) return res.status(404).json({ message: "No students found in this class" });

    const fees = await Fee.insertMany(
      students.map((s) => ({ student: s._id, class: classId, amount, paidAmount: 0, balance: amount, dueDate, description, createdBy: userId }))
    );

    await logActivity({ userId: userId.toString(), action: `Bulk created ${fees.length} fee records for class` });
    res.status(201).json({ message: `Created ${fees.length} fee records`, fees });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFees = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const studentId = req.query.student as string;

    const query: any = {};
    if (user.role === "student") {
      query.student = user._id;
    } else if (user.role === "parent") {
      const parent = await User.findById(user._id).select("children").lean();
      const children = (parent as any)?.children ?? [];
      if (studentId && children.map(String).includes(studentId)) {
        query.student = studentId;
      } else {
        query.student = { $in: children };
      }
    } else if (studentId) {
      query.student = studentId;
    }
    if (status && status !== "all") query.status = status;

    const [total, fees] = await Promise.all([
      Fee.countDocuments(query),
      Fee.find(query)
        .populate("student", "name email")
        .populate("class", "name")
        .sort({ dueDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.json({ fees, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeeById = async (req: AuthRequest, res: Response) => {
  try {
    const fee = await Fee.findById(req.params.id).populate("student", "name email").populate("class", "name");
    if (!fee) return res.status(404).json({ message: "Fee record not found" });
    res.json({ fee });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const payFee = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, method, reference } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Payment amount is required" });

    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: "Fee not found" });
    if (fee.status === "paid") return res.status(400).json({ message: "Fee already fully paid" });

    fee.paidAmount += amount;
    fee.balance = Math.max(0, fee.amount - fee.paidAmount);
    fee.status = fee.balance === 0 ? "paid" : "partial";
    fee.paymentHistory.push({ amount, method, reference, date: new Date() });
    await fee.save();

    await logActivity({ userId: req.user!._id.toString(), action: `Recorded payment of ${amount} for fee` });
    res.json({ fee });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateFeeStatus = async (req: AuthRequest, res: Response) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!fee) return res.status(404).json({ message: "Fee not found" });
    res.json({ fee });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
