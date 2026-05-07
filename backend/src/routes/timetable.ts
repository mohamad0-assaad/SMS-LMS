import express from "express";
import { generateTimetable, getTimetable, getTeacherSchedule } from "../controllers/timetable.ts";
import { protect, authorize } from "../middleware/auth.ts";

const timeRouter = express.Router();

timeRouter.post("/generate", protect, authorize(["admin"]), generateTimetable);
timeRouter.get("/teacher-schedule", protect, authorize(["teacher", "admin"]), getTeacherSchedule);
timeRouter.get("/:classId", protect, getTimetable);

export default timeRouter;