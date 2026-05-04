import express from "express";
import { protect, authorize } from "../middleware/auth.ts";
import { markAttendance, getClassAttendance, getClassAttendanceHistory, getMyAttendance } from "../controllers/attendance.ts";

const attendanceRouter = express.Router();

attendanceRouter.post("/mark", protect, authorize(["admin", "teacher"]), markAttendance);
attendanceRouter.get("/class/:classId", protect, authorize(["admin", "teacher"]), getClassAttendance);
attendanceRouter.get("/class/:classId/history", protect, authorize(["admin", "teacher"]), getClassAttendanceHistory);
attendanceRouter.get("/me", protect, getMyAttendance);

export default attendanceRouter;
