import path from "path";
import fs from "fs";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.ts";
import StudyMaterial from "../models/StudyMaterial.ts";
import Class from "../models/class.ts";
import { logActivity } from "../utils/activitieslog.ts";

const uploadsDirectory = path.join(process.cwd(), "uploads");

export const uploadMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const file = (req as any).file;
    const { title, description, subject, classId, academicYearId } = req.body;

    if (!file) return res.status(400).json({ message: "No file uploaded" });
    if (!title || !subject) return res.status(400).json({ message: "Title and subject are required" });

    if (classId) {
      const classRef = await Class.findById(classId);
      if (!classRef) return res.status(404).json({ message: "Class not found" });
    }

    const material = await StudyMaterial.create({
      title, description, subject,
      class: classId || undefined,
      academicYear: academicYearId || undefined,
      uploadedBy: user._id,
      fileName: file.originalname,
      filePath: file.filename,
      fileSize: file.size,
      fileType: file.mimetype,
    });

    await logActivity({ userId: user._id.toString(), action: `Uploaded study material: ${title}` });
    res.status(201).json({ message: "Study material uploaded successfully", material });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to upload study material" });
  }
};

export const getMaterials = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const classId = req.query.classId as string;
    const search = req.query.search as string;

    const query: any = {};
    if (user.role === "student") query.class = user.studentClass;
    else if (classId) query.class = classId;
    if (search) query.title = { $regex: search, $options: "i" };

    const materials = await StudyMaterial.find(query)
      .populate("class", "name")
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const host = req.protocol + "://" + req.get("host");
    const formatted = materials.map((m) => ({
      ...m,
      className: (m.class as any)?.name || "All Classes",
      uploadedByName: (m.uploadedBy as any)?.name || "Unknown",
      downloadUrl: `${host}/uploads/${m.filePath}`,
    }));

    res.json({ materials: formatted });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load study materials" });
  }
};

export const downloadMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const material = await StudyMaterial.findById(req.params.id).lean();
    if (!material) return res.status(404).json({ message: "Study material not found" });

    const filePath = path.join(uploadsDirectory, material.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found on server" });

    res.download(filePath, material.fileName);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to download study material" });
  }
};

export const deleteMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const material = await StudyMaterial.findById(req.params.id).lean();
    if (!material) return res.status(404).json({ message: "Study material not found" });

    const isOwner = material.uploadedBy.toString() === user._id.toString();
    if (!isOwner && user.role !== "admin")
      return res.status(403).json({ message: "Not authorized to delete this material" });

    const filePath = path.join(uploadsDirectory, material.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await StudyMaterial.findByIdAndDelete(req.params.id);
    await logActivity({ userId: user._id.toString(), action: `Deleted study material: ${material.title}` });
    res.json({ message: "Material deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to delete study material" });
  }
};
