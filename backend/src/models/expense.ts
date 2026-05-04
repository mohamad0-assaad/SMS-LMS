import mongoose, { Schema, Document } from "mongoose";

export interface IExpense extends Document {
  title: string;
  category: string;
  amount: number;
  date: Date;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
}

const expenseSchema = new Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IExpense>("Expense", expenseSchema);
