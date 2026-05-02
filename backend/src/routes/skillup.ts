import express from "express";
import { skillupPredict } from "../controllers/skillup.ts";
import { protect } from "../middleware/auth.ts";

const skillupRouter = express.Router();

skillupRouter.post("/predict", protect, skillupPredict);

export default skillupRouter;
