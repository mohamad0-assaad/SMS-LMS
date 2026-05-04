import express from "express";
import { protect, authorize } from "../middleware/auth.ts";
import { createExpense, getExpenses, deleteExpense } from "../controllers/expense.ts";

const expenseRouter = express.Router();

expenseRouter.route("/").get(protect, authorize(["admin"]), getExpenses).post(protect, authorize(["admin"]), createExpense);
expenseRouter.route("/:id").delete(protect, authorize(["admin"]), deleteExpense);

export default expenseRouter;
