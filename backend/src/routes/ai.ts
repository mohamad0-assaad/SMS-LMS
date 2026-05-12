import express from "express";
import { aiAsk, aiGenerateClassQuiz, aiRecommend } from "../controllers/aiInsights.ts";
import { authorize, protect } from "../middleware/auth.ts";

const aiRouter = express.Router();

const staffOnly = ["admin", "teacher"] as const;
const askRoles = ["admin", "teacher", "student", "parent"] as const;

aiRouter.post("/ask", protect, authorize([...askRoles]), aiAsk);
aiRouter.post("/recommend", protect, authorize([...staffOnly]), aiRecommend);
aiRouter.post(
  "/generate-class-quiz",
  protect,
  authorize([...staffOnly]),
  aiGenerateClassQuiz
);

export default aiRouter;
