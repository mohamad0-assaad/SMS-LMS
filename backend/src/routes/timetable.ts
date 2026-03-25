import express from "express";
import { generateTimetable, getTimetable,  } from "../controllers/timetable.ts";
import { protect, authorize } from "../middleware/auth.ts";

const timeRouter = express.Router();

// Generate: Admin only (costs money/resources)
timeRouter.post("/generate", protect, authorize(["admin"]), generateTimetable);

// View: Everyone (Students need to see their schedule)
 timeRouter.get("/:classId", protect, getTimetable);

export default timeRouter;