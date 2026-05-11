import { type Request, type Response } from "express";
import User from "../models/user.ts";
import Class from "../models/class.ts";
import Exam from "../models/exam.ts";
import Submission from "../models/submission.ts";
import ActivityLog from "../models/activitieslog.ts";
import Attendance from "../models/Attendance.ts";

// @desc    Get Dashboard Statistics (Role Based)
// @route   GET /api/dashboard/stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let stats = {};

    const activityQuery = user.role === "admin" ? {} : { user: user._id };
    const recentActivities = await ActivityLog.find(activityQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name");

    const formattedActivity = recentActivities.map(
      (log) =>
        `${(log.user as any)?.name ?? "System"}: ${log.action} (${new Date(
          log.createdAt as any
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`
    );

    if (user.role === "admin") {
      const [totalStudents, totalTeachers, activeExams, activeClasses] = await Promise.all([
        User.countDocuments({ role: "student", isActive: true }),
        User.countDocuments({ role: "teacher", isActive: true }),
        Exam.countDocuments({ isActive: true }),
        Class.countDocuments({}),
      ]);

      // Real attendance: % of present+late records out of all records this month
      const monthStart = new Date();
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const [totalAttRecs, presentAttRecs] = await Promise.all([
        Attendance.countDocuments({ date: { $gte: monthStart } }),
        Attendance.countDocuments({ date: { $gte: monthStart }, status: { $in: ["present", "late"] } }),
      ]);
      const avgAttendance = totalAttRecs > 0
        ? `${Math.round((presentAttRecs / totalAttRecs) * 100)}%`
        : "N/A";

      stats = {
        totalStudents,
        totalTeachers,
        activeExams,
        activeClasses,
        avgAttendance,
        recentActivity: formattedActivity,
      };

    } else if (user.role === "teacher") {
      const myClasses = await Class.find({ classTeacher: user._id }).select("_id students");
      const myClassesCount = myClasses.length;
      const totalStudentsInMyClasses = myClasses.reduce((sum, c) => sum + (c.students?.length ?? 0), 0);

      const myExams = await Exam.find({ teacher: user._id }).select("_id");
      const myExamIds = myExams.map((e) => e._id);
      const pendingGrading = await Submission.countDocuments({
        exam: { $in: myExamIds },
        score: 0,
      });

      stats = {
        myClassesCount,
        totalStudentsInMyClasses,
        pendingGrading,
        recentActivity: formattedActivity,
      };

    } else if (user.role === "student") {
      const [nextExam, pendingAssignments] = await Promise.all([
        Exam.findOne({ class: user.studentClass, dueDate: { $gte: new Date() } }).sort({ dueDate: 1 }),
        Exam.countDocuments({ class: user.studentClass, isActive: true, dueDate: { $gte: new Date() } }),
      ]);

      // Real attendance for this student
      const total = await Attendance.countDocuments({ student: user._id });
      const present = await Attendance.countDocuments({ student: user._id, status: { $in: ["present", "late"] } });
      const myAttendance = total > 0 ? `${Math.round((present / total) * 100)}%` : "N/A";

      stats = {
        myAttendance,
        pendingAssignments,
        nextExam: nextExam?.title || "No upcoming exams",
        nextExamDate: nextExam ? new Date(nextExam.dueDate).toLocaleDateString() : "",
        recentActivity: formattedActivity,
      };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: (error as any)?.message || "Server Error" });
  }
};
