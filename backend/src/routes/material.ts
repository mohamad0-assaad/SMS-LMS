import express from "express";
import multer from "multer";
import { protect, authorize } from "../middleware/auth.ts";
import { uploadMaterial, getMaterials, downloadMaterial, deleteMaterial } from "../controllers/material.ts";

const materialRouter = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads"),
  filename: (_req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${sanitized}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

materialRouter.post("/upload", protect, authorize(["admin", "teacher"]), upload.single("file"), uploadMaterial);
materialRouter.get("/", protect, getMaterials);
materialRouter.get("/:id/download", protect, downloadMaterial);
materialRouter.delete("/:id", protect, authorize(["admin", "teacher"]), deleteMaterial);

export default materialRouter;
