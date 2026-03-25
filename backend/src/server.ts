import cookieParser from "cookie-parser";
import express from "express";
import type { Application } from "express";
import type { Request } from "express";
import type { Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import { json } from "node:stream/consumers";
import { connectDB } from "./config/db";
import userRoutes from "./routes/user";
import LogsRouter from "./routes/activitieslog";
import academicYearRouter from "./routes/academicYear";
import classRouter from "./routes/class";
import subjectRouter from "./routes/subject";
import { serve } from "inngest/express";
import { inngest,  } from "./inngest"
import {generateExam, generateTimeTable } from "./inngest/functions"
import timeRouter from "./routes/timetable";
import examRouter from "./routes/exam";
import dashboardRouter from "./routes/dashboard";
// import mongoose from "mongoose";
const dns=require("dns")
dns.setServers([
  '1.1.1.1','8.8.8.8'
])

dotenv.config();

const app: Application = express();
const PORT=process.env.PORT ||5000;


app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());


//log http requests to consol
if(process.env.NODE_ENV=="development"){
    app.use(morgan("dev"));
}

//cross-origin resources sharing (cors) middleware
//credentials: true allows cokkies to be sent with requests

app.use(
    cors({
        origin:process.env.CLIENT_URL,
        credentials:true,
    })
)

//healt check route
app.get("/", (req:Request ,res:Response)=>{
    res.status(200).json({status: "OK",message:"Server is healthy"})
})

//import user routes
app.use("/api/users", userRoutes);
app.use("/api/activities", LogsRouter);
app.use("/api/academic-years",academicYearRouter)
app.use("/api/classes",classRouter);
app.use("/api/subjects",subjectRouter);
app.use("/api/timetables", timeRouter);
app.use("/api/exams",examRouter);
app.use("/api/dashboard",dashboardRouter)
app.use("/api/inngest",serve({ client: inngest, functions:[generateTimeTable,generateExam],}));

// global error handler middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
console.error(err.stack);
res.status(500).json({status:"Error",message:err.message});
  });




connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is running on port 5000");
  });
});

