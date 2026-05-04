import express from "express";
import { protect, authorize } from "../middleware/auth.ts";
import { createSalary, getSalaries, updateSalary, deleteSalary } from "../controllers/salary.ts";

const salaryRouter = express.Router();

salaryRouter.route("/").get(protect, authorize(["admin", "teacher"]), getSalaries).post(protect, authorize(["admin"]), createSalary);
salaryRouter.route("/:id").put(protect, authorize(["admin"]), updateSalary).delete(protect, authorize(["admin"]), deleteSalary);

export default salaryRouter;
