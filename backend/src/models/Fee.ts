import mongoose, { Document, Schema } from "mongoose";

export interface IFee extends Document {
  student: mongoose.Types.ObjectId;
  class?: mongoose.Types.ObjectId;
  amount: number;
  paidAmount: number;
  balance: number;
  status: "unpaid" | "partial" | "paid";
  dueDate: Date;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  paymentHistory: { amount: number; method?: string; reference?: string; date: Date }[];
}

const feeSchema = new Schema<IFee>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", default: null },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    balance: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["unpaid", "partial", "paid"], default: "unpaid" },
    dueDate: { type: Date, required: true },
    description: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paymentHistory: [
      {
        amount: { type: Number, required: true, min: 0 },
        method: { type: String, trim: true },
        reference: { type: String, trim: true },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

feeSchema.index({ student: 1 });
feeSchema.index({ class: 1 });

export default mongoose.model<IFee>("Fee", feeSchema);
