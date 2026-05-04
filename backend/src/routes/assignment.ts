import express from "express";
import { protect, authorize } from "../middleware/auth.ts";
import { createAssignment, getAssignments, updateAssignment, deleteAssignment } from "../controllers/assignment.ts";

const assignmentRouter = express.Router();

assignmentRouter.route("/")
  .get(protect, getAssignments)
  .post(protect, authorize(["admin", "teacher"]), createAssignment);

assignmentRouter.route("/:id")
  .put(protect, authorize(["admin", "teacher"]), updateAssignment)
  .delete(protect, authorize(["admin", "teacher"]), deleteAssignment);

export default assignmentRouter;
