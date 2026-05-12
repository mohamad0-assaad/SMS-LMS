import express from "express";
import {
  triggerExamGeneration,
  getExams,
  getMyExamResults,
  getChildExamResults,
  submitExam,
  getExamById,
  toggleExamStatus,
  getExamResult,
  getExamSubmissions,
  deleteExam,
} from "../controllers/exam.ts";
import { protect, authorize } from "../middleware/auth.ts";

const examRouter = express.Router();


examRouter.post(
  "/generate",
  protect,
  authorize(["teacher", "admin"]),
  triggerExamGeneration
);

examRouter.get(
  "/my-results",
  protect,
  authorize(["student"]),
  getMyExamResults
);

examRouter.get(
  "/child/:id/results",
  protect,
  authorize(["parent"]),
  getChildExamResults
);

examRouter.get(
  "/",
  protect,
  authorize(["teacher", "student", "admin"]),
  getExams
);

// we try on the fronten
// Student Routes
examRouter.post(
  "/:id/submit",
  protect,
  authorize(["student", "admin"]),
  submitExam
);

// teacher and admin routes
examRouter.patch(
  "/:id/status",
  protect,
  authorize(["teacher", "admin"]),
  toggleExamStatus
);

examRouter.get(
  "/:id/result",
  protect,
  authorize(["student", "admin", "teacher"]),
  getExamResult
);

examRouter.get(
  "/:id/submissions",
  protect,
  authorize(["teacher", "admin"]),
  getExamSubmissions
);

examRouter.get(
  "/:id",
  protect,
  authorize(["teacher", "student", "admin"]),
  getExamById
);

examRouter.delete(
  "/:id",
  protect,
  authorize(["teacher", "admin"]),
  deleteExam
);

export default examRouter;