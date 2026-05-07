import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import type { Application } from "express";
import type { Request } from "express";
import type { Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { connectDB } from "./config/db.ts";
import userRoutes from "./routes/user.ts";
import LogsRouter from "./routes/activitieslog.ts";
import academicYearRouter from "./routes/academicYear.ts";
import classRouter from "./routes/class.ts";
import subjectRouter from "./routes/subject.ts";
import timeRouter from "./routes/timetable.ts";
import examRouter from "./routes/exam.ts";
import dashboardRouter from "./routes/dashboard.ts";
import aiRouter from "./routes/ai.ts";
import skillupRouter from "./routes/skillup.ts";
import attendanceRouter from "./routes/attendance.ts";
import assignmentRouter from "./routes/assignment.ts";
import feeRouter from "./routes/fee.ts";
import expenseRouter from "./routes/expense.ts";
import salaryRouter from "./routes/salary.ts";
import reportCardRouter from "./routes/reportcard.ts";
import materialRouter from "./routes/material.ts";
import searchRouter from "./routes/search.ts";
import messageRouter from "./routes/message.ts";

dotenv.config();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(compression());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(uploadsDir));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const corsOrigin = process.env.NODE_ENV === "development"
  ? (origin: string | undefined, cb: (e: Error | null, ok?: boolean) => void) =>
      cb(null, !origin || /^http:\/\/localhost(:\d+)?$/.test(origin))
  : process.env.CLIENT_URL;
app.use(cors({ origin: corsOrigin, credentials: true }));

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "Server is healthy" });
});

app.use("/api/users", userRoutes);
app.use("/api/activities", LogsRouter);
app.use("/api/academic-years", academicYearRouter);
app.use("/api/classes", classRouter);
app.use("/api/subjects", subjectRouter);
app.use("/api/timetables", timeRouter);
app.use("/api/exams", examRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/ai", aiRouter);
app.use("/api/skillup", skillupRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/fees", feeRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/salary", salaryRouter);
app.use("/api/report-cards", reportCardRouter);
app.use("/api/materials", materialRouter);
app.use("/api/search", searchRouter);
app.use("/api/messages", messageRouter);

app.use((err: Error, _req: Request, res: Response, _next: Function) => {
  console.error(err.stack);
  res.status(500).json({ status: "Error", message: err.message });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
