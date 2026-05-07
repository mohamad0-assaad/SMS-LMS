import express from "express";
import { protect, authorize } from "../middleware/auth.ts";
import { sendMessage, getInbox, getSent, markRead, getMyStudents } from "../controllers/message.ts";

const messageRouter = express.Router();

messageRouter.get("/my-students", protect, authorize(["teacher", "admin"]), getMyStudents);
messageRouter.post("/", protect, authorize(["teacher", "admin"]), sendMessage);
messageRouter.get("/sent", protect, authorize(["teacher", "admin"]), getSent);
messageRouter.get("/inbox", protect, authorize(["parent"]), getInbox);
messageRouter.put("/:id/read", protect, authorize(["parent"]), markRead);

export default messageRouter;
