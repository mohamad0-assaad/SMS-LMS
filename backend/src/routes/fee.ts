import express from "express";
import { protect, authorize } from "../middleware/auth.ts";
import { createFee, bulkCreateFees, getFees, getFeeById, payFee, updateFeeStatus } from "../controllers/fee.ts";

const feeRouter = express.Router();

feeRouter.route("/").get(protect, authorize(["admin", "teacher", "student", "parent"]), getFees).post(protect, authorize(["admin", "teacher"]), createFee);
feeRouter.route("/bulk").post(protect, authorize(["admin"]), bulkCreateFees);
feeRouter.route("/:id").get(protect, getFeeById);
feeRouter.route("/:id/pay").put(protect, payFee);
feeRouter.route("/:id/status").put(protect, authorize(["admin"]), updateFeeStatus);

export default feeRouter;
