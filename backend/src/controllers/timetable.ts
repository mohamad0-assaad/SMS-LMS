import { type Request, type Response } from "express";
import { logActivity } from "../utils/activitieslog.ts";
import Timetable from "../models/timetable.ts";
import Class from "../models/class.ts";
import User from "../models/user.ts";
import { generateText } from "ai";
import { getGeminiModel } from "../config/geminiModel.ts";

// @desc    Generate a Timetable using AI (synchronous)
// @route   POST /api/timetables/generate
// @access  Private/Admin
export const generateTimetable = async (req: Request, res: Response) => {
  try {
    const { classId, academicYearId, settings } = req.body;

    if (!classId || !academicYearId) {
      res.status(400).json({ message: "classId and academicYearId are required" });
      return;
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ message: "GOOGLE_GENERATIVE_AI_API_KEY is not configured" });
      return;
    }

    // Fetch class + subjects
    const classData = await Class.findById(classId).populate("subjects");
    if (!classData) {
      res.status(404).json({ message: "Class not found" });
      return;
    }

    // Find teachers whose subject list overlaps with this class
    const classSubjectIds = classData.subjects.map((s: any) => s._id.toString());
    const allTeachers = await User.find({ role: "teacher" });
    const subjectTeacherIds = new Set(
      classData.subjects.flatMap((s: any) =>
        Array.isArray(s.teacher) ? s.teacher.map((t: any) => t.toString()) : []
      )
    );

    const qualifiedTeachers = allTeachers
      .filter((t) => {
        const teacherId = t._id.toString();
        const hasSubjectMatch = t.teacherSubject?.some((sid) => classSubjectIds.includes(sid.toString()));
        const isAssignedToSubject = subjectTeacherIds.has(teacherId);
        return Boolean(hasSubjectMatch || isAssignedToSubject);
      })
      .map((t) => ({ id: t._id, name: t.name, subjects: t.teacherSubject }));

    const subjectsPayload = classData.subjects.map((s: any) => ({
      id: s._id,
      name: s.name,
      code: s.code,
      teachers: Array.isArray(s.teacher) ? s.teacher.map((t: any) => t.toString()) : [],
    }));

    const missing: string[] = [];
    if (!subjectsPayload.length) missing.push("this class has no subjects assigned");
    if (!qualifiedTeachers.length) missing.push("no teachers are qualified for the assigned subjects");
    if (missing.length) {
      res.status(400).json({
        message: `Cannot generate timetable because ${missing.join(" and ")}.`,
        subjectsCount: subjectsPayload.length,
        qualifiedTeacherCount: qualifiedTeachers.length,
      });
      return;
    }

    // Fetch existing timetables for clash detection
    const allTimetables = await Timetable.find({ academicYear: academicYearId });

    const { startTime = "08:00", endTime = "15:00", periods = 7 } = settings ?? {};

    const prompt = `
You are a school scheduler. Generate a weekly timetable (Monday to Friday).

CONTEXT:
- Class: ${classData.name}
- Hours: ${startTime} to ${endTime} (${periods} periods/day).

RESOURCES:
- Subjects: ${JSON.stringify(subjectsPayload)}
- Teachers: ${JSON.stringify(qualifiedTeachers)}
- Other Timetables: ${JSON.stringify(allTimetables)}

STRICT RULES:
1. Assign a Teacher to every Subject period.
2. Teacher MUST have the subject ID in their list.
3. Break Time/Free Period after every 2 periods (10 minutes), Lunch after 5 periods (30 minutes).
4. Avoid teacher clashes with other classes.
5. Output strict JSON only. Schema:
   {
     "schedule": [
       {
         "day": "Monday",
         "periods": [
           { "subject": "SUBJECT_ID", "teacher": "TEACHER_ID", "startTime": "HH:MM", "endTime": "HH:MM" }
         ]
       }
     ]
   }
`;

    const { text } = await generateText({ prompt, model: getGeminiModel(apiKey) });
    const cleanJSON = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const aiSchedule = JSON.parse(cleanJSON) as { schedule: any[] };

    // Replace any existing timetable for this class+year
    await Timetable.findOneAndDelete({ class: classId, academicYear: academicYearId });
    await Timetable.create({ class: classId, academicYear: academicYearId, schedule: aiSchedule.schedule });

    const userId = (req as any).user._id;
    await logActivity({ userId, action: `Generated timetable for class ID: ${classId}` });

    res.status(200).json({ message: "Timetable generated successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error?.message ?? "Server Error", error });
  }
};


// @desc    Get all periods for the logged-in teacher across all classes
// @route   GET /api/timetables/teacher-schedule
// @access  Private/Teacher
export const getTeacherSchedule = async (req: Request, res: Response) => {
  try {
    // Admin can pass ?teacherId=... to view any teacher's schedule
    const reqUser = (req as any).user;
    const teacherId =
      reqUser.role === "admin" && req.query.teacherId
        ? String(req.query.teacherId)
        : String(reqUser._id);

    const allTimetables = await Timetable.find({})
      .populate("class", "name")
      .populate("schedule.periods.subject", "name")
      .populate("schedule.periods.teacher", "_id name");

    type PeriodEntry = { startTime: string; endTime: string; subject: string; className: string };
    const dayMap = new Map<string, PeriodEntry[]>();

    for (const tt of allTimetables) {
      const className = (tt.class as any)?.name ?? "Unknown";
      for (const day of tt.schedule) {
        for (const period of (day as any).periods) {
          const tId = period.teacher?._id?.toString() ?? period.teacher?.toString() ?? "";
          if (tId !== teacherId) continue;

          if (!dayMap.has(day.day)) dayMap.set(day.day, []);
          dayMap.get(day.day)!.push({
            startTime: period.startTime ?? "",
            endTime: period.endTime ?? "",
            subject: (period.subject as any)?.name ?? "—",
            className,
          });
        }
      }
    }

    const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
    const schedule = Array.from(dayMap.entries()).map(([day, periods]) => ({
      day,
      periods: periods.sort((a, b) => toMin(a.startTime) - toMin(b.startTime)),
    }));

    res.json({ schedule });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Timetable by Class
// @route   GET /api/timetables/:classId
export const getTimetable = async (req: Request, res: Response) => {
  try {
    const timetable = await Timetable.findOne({ class: req.params.classId })
      .populate("schedule.periods.subject", "name code")
      .populate("schedule.periods.teacher", "name email");

    if (!timetable)
      return res.status(404).json({ message: "Timetable not found" });

    res.json(timetable);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};