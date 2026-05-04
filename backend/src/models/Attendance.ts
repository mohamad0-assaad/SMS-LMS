import mongoose, { Document, Schema } from "mongoose";

export type AttendanceStatus = "present" | "absent" | "late";

export interface IAttendance extends Document {
  class: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  markedBy: mongoose.Types.ObjectId;
  academicYear?: mongoose.Types.ObjectId;
  remark?: string;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["present", "absent", "late"], default: "present" },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    academicYear: { type: Schema.Types.ObjectId, ref: "AcademicYear" },
    remark: { type: String, trim: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ class: 1, student: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>("Attendance", attendanceSchema);
