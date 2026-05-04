import mongoose, { Schema, Document } from "mongoose";

export interface ISalary extends Document {
  employeeName: string;
  employeeId?: mongoose.Types.ObjectId;
  role: string;
  amount: number;
  paymentDate: Date;
  status: "Paid" | "Pending" | "Processing";
  note?: string;
  createdBy: mongoose.Types.ObjectId;
}

const salarySchema = new Schema(
  {
    employeeName: { type: String, required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "User" },
    role: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    status: { type: String, enum: ["Paid", "Pending", "Processing"], default: "Pending" },
    note: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISalary>("Salary", salarySchema);
