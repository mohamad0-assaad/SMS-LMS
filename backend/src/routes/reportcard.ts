import express from "express";
import { protect, authorize } from "../middleware/auth.ts";
import { triggerReportGeneration, getMyReports, getClassReports } from "../controllers/reportcard.ts";

const reportCardRouter = express.Router();

reportCardRouter.get("/", protect, getMyReports);
reportCardRouter.get("/class/:classId", protect, authorize(["admin", "teacher"]), getClassReports);
reportCardRouter.post("/generate", protect, authorize(["admin", "teacher"]), triggerReportGeneration);

export default reportCardRouter;
