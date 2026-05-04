import mongoose, { Document, Schema } from "mongoose";

export interface IStudyMaterial extends Document {
  title: string;
  description?: string;
  subject: string;
  class?: mongoose.Types.ObjectId;
  academicYear?: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  createdAt: Date;
}

const studyMaterialSchema = new Schema<IStudyMaterial>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    class: { type: Schema.Types.ObjectId, ref: "Class" },
    academicYear: { type: Schema.Types.ObjectId, ref: "AcademicYear" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileType: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IStudyMaterial>("StudyMaterial", studyMaterialSchema);
