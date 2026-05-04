import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.ts";
import Salary from "../models/salary.ts";
import User from "../models/user.ts";
import { logActivity } from "../utils/activitieslog.ts";

export const createSalary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { employeeId, amount, paymentDate, status, note } = req.body;
    if (!employeeId || !amount || !paymentDate)
      return res.status(400).json({ message: "Employee, amount, and payment date are required" });

    const employee = await User.findById(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const salary = await Salary.create({ employeeName: employee.name, employeeId, role: employee.role, amount, paymentDate, status: status || "Pending", note, createdBy: userId });
    await logActivity({ userId: userId.toString(), action: `Recorded salary for ${employee.name}` });
    res.status(201).json({ salary });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSalaries = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const query: any = {};
    if (user.role === "teacher") query.employeeId = user._id;
    if (status && status !== "all") query.status = status;
    if (search) query.employeeName = { $regex: search, $options: "i" };

    const [total, salaries] = await Promise.all([
      Salary.countDocuments(query),
      Salary.find(query).populate("employeeId", "name email").sort({ paymentDate: -1 }).skip((page - 1) * limit).limit(limit),
    ]);

    res.json({ salaries, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSalary = async (req: AuthRequest, res: Response) => {
  try {
    const salary = await Salary.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!salary) return res.status(404).json({ message: "Salary record not found" });
    await logActivity({ userId: req.user!._id.toString(), action: `Updated salary for ${salary.employeeName}` });
    res.json({ salary });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSalary = async (req: AuthRequest, res: Response) => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);
    if (!salary) return res.status(404).json({ message: "Salary record not found" });
    await logActivity({ userId: req.user!._id.toString(), action: `Deleted salary for ${salary.employeeName}` });
    res.json({ message: "Salary record deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
