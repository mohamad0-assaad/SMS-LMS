import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.ts";
import Expense from "../models/expense.ts";
import { logActivity } from "../utils/activitieslog.ts";

export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { title, category, amount, date, description } = req.body;
    if (!title || !category || !amount || !date)
      return res.status(400).json({ message: "Title, category, amount, and date are required" });

    const expense = await Expense.create({ title, category, amount, date, description, createdBy: userId });
    await logActivity({ userId: userId.toString(), action: `Recorded expense: ${title}` });
    res.status(201).json({ expense });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const query: any = {};
    if (category && category !== "all") query.category = category;
    if (search) query.title = { $regex: search, $options: "i" };

    const [total, expenses] = await Promise.all([
      Expense.countDocuments(query),
      Expense.find(query).populate("createdBy", "name").sort({ date: -1 }).skip((page - 1) * limit).limit(limit),
    ]);

    res.json({ expenses, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    await logActivity({ userId: req.user!._id.toString(), action: `Deleted expense: ${expense.title}` });
    res.json({ message: "Expense deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
