import mongoose, { Schema, Document } from "mongoose";

export interface IAssignment extends Document {
  title: string;
  description: string;
  subject: mongoose.Types.ObjectId;
  class: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  dueDate: Date;
  isActive: boolean;
}

const assignmentSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAssignment>("Assignment", assignmentSchema);
