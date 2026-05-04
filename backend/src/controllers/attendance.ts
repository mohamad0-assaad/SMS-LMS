import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.ts";
import Class from "../models/class.ts";
import Attendance from "../models/Attendance.ts";
import { logActivity } from "../utils/activitieslog.ts";

const normalizeDate = (dateString: string) => {
  const date = new Date(dateString);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { classId, date, records } = req.body;

    if (!classId || !records || !Array.isArray(records))
      return res.status(400).json({ message: "Missing attendance payload" });

    const classData = await Class.findById(classId);
    if (!classData) return res.status(404).json({ message: "Class not found" });

    if (user.role === "teacher" && classData.classTeacher.toString() !== user._id.toString())
      return res.status(403).json({ message: "You are not assigned to this class" });

    const attendanceDate = normalizeDate(date || new Date().toISOString());

    await Promise.all(
      records.map((record: any) =>
        Attendance.findOneAndUpdate(
          { class: classId, student: record.studentId, date: attendanceDate },
          { status: record.status, remark: record.remark || "", markedBy: user._id, academicYear: classData.academicYear },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        )
      )
    );

    await logActivity({ userId: user._id.toString(), action: `Marked attendance for class ${classData.name} on ${attendanceDate.toISOString().slice(0, 10)}` });
    res.json({ message: "Attendance saved successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to save attendance" });
  }
};

export const getClassAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const attendanceDate = normalizeDate((req.query.date as string) || new Date().toISOString());

    const classData = await Class.findById(classId).populate("students", "name email");
    if (!classData) return res.status(404).json({ message: "Class not found" });

    const records = await Attendance.find({ class: classId, date: attendanceDate }).lean();
    const attendanceMap = new Map(records.map((r) => [r.student.toString(), r]));

    const attendance = (classData.students as any[]).map((student) => {
      const record = attendanceMap.get(student._id.toString());
      return { studentId: student._id, name: student.name, email: student.email, status: record?.status || "absent", remark: record?.remark || "" };
    });

    res.json({ classId: classData._id, className: classData.name, date: attendanceDate.toISOString().slice(0, 10), attendance });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load attendance" });
  }
};

export const getClassAttendanceHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const endDate = normalizeDate((req.query.endDate as string) || new Date().toISOString());
    endDate.setUTCHours(23, 59, 59, 999);
    const startDate = normalizeDate((req.query.startDate as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const classData = await Class.findById(classId);
    if (!classData) return res.status(404).json({ message: "Class not found" });

    const records = await Attendance.find({ class: classId, date: { $gte: startDate, $lte: endDate } })
      .populate("student", "name email")
      .sort({ date: -1 })
      .lean();

    res.json({
      classId: classData._id,
      className: classData.name,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      history: records.map((r) => ({
        _id: r._id,
        studentId: (r.student as any)?._id || r.student,
        studentName: (r.student as any)?.name || "Unknown",
        date: r.date.toISOString().slice(0, 10),
        status: r.status,
        remark: r.remark || "",
      })),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load attendance history" });
  }
};

export const getMyAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== "student")
      return res.status(403).json({ message: "Only students can fetch personal attendance" });

    const records = await Attendance.find({ student: user._id }).populate("class", "name").sort({ date: -1 }).lean();
    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const late = records.filter((r) => r.status === "late").length;

    res.json({
      total, present, absent, late,
      percentage: total ? Math.round((present / total) * 100) : 0,
      history: records.map((r) => ({
        _id: r._id,
        className: (r.class as any)?.name || "Unknown",
        date: r.date.toISOString().slice(0, 10),
        status: r.status,
        remark: r.remark || "",
      })),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load attendance" });
  }
};
