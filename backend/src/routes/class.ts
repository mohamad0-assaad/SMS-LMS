
import express from "express";
import {
  createClass,
  updateClass,
  deleteClass,
  getAllClasses,
  getClassStudents,
  setClassStudents,
} from "../controllers/class.ts";
import { authorize, protect } from "../middleware/auth.ts";

const classRouter = express.Router();

classRouter.post("/create", protect, authorize(["admin"]), createClass);
classRouter.get("/", protect, authorize(["admin", "teacher"]), getAllClasses);
classRouter.get("/:id/students", protect, authorize(["admin", "teacher"]), getClassStudents);
classRouter.put("/:id/students", protect, authorize(["admin"]), setClassStudents);
classRouter.patch("/update/:id", protect, authorize(["admin"]), updateClass);
classRouter.delete("/delete/:id", protect, authorize(["admin"]), deleteClass);

export default classRouter;
