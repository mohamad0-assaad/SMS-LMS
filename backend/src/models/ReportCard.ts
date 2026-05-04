import mongoose, { Schema, Document } from "mongoose";

export interface IReportCard extends Document {
  student: mongoose.Types.ObjectId;
  class: mongoose.Types.ObjectId;
  term: string;
  results: { subjectName: string; score: number; grade: string; remarks: string }[];
  totalScore: number;
  averageScore: number;
  attendance: number;
  teacherComment: string;
  generatedAt: Date;
}

const reportCardSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  term: { type: String, required: true },
  results: [{ subjectName: String, score: Number, grade: String, remarks: String }],
  totalScore: Number,
  averageScore: Number,
  attendance: { type: Number, default: 0 },
  teacherComment: String,
  generatedAt: { type: Date, default: Date.now },
});

reportCardSchema.index({ student: 1, term: 1 }, { unique: true });

export default mongoose.model<IReportCard>("ReportCard", reportCardSchema);
