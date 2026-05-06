import { type Request, type Response } from "express";
import mongoose from "mongoose";
import Class from "../models/class.ts";
import User from "../models/user.ts";
import Submission from "../models/submission.ts";
import Attendance from "../models/Attendance.ts";
import Exam from "../models/exam.ts";
import { generateToken } from "../utils/generateToken.ts";
// import { generateToken } from "../utils/generateToken.ts";
 import { logActivity } from "../utils/activitieslog.ts";
import type { AuthRequest } from "../middleware/auth.ts";
// import type { AuthRequest } from "../middleware/auth.ts";


// @desc    Register a new user
// @route   POST /api/users/register
// @access  Private (Admin & Teacher only)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      role,
      studentClass,
      teacherSubject,
      isActive,
    } = req.body;
    const assignedClass = req.body.assignedClass as string | undefined;
    const authUser = (req as AuthRequest).user;

    if (authUser?.role === "teacher" && role !== "student") {
      res.status(403).json({ message: "Teachers can only register students" });
      return;
    }

    if (role === "student") {
      if (!studentClass || !mongoose.isValidObjectId(studentClass)) {
        res.status(400).json({ message: "Select a class for the student" });
        return;
      }
      const cls = await Class.findById(studentClass);
      if (!cls) {
        res.status(400).json({ message: "Class not found" });
        return;
      }
    }

    if (role === "teacher" && authUser?.role === "admin") {
      if (!assignedClass || !mongoose.isValidObjectId(assignedClass)) {
        res.status(400).json({ message: "Select a class for this teacher (class teacher)" });
        return;
      }
      const cls = await Class.findById(assignedClass);
      if (!cls) {
        res.status(400).json({ message: "Class not found" });
        return;
      }
    }

    // check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // create user
    const newUser = await User.create({
      name,
      email,
      password,
      role,
      studentClass: role === "student" ? studentClass : undefined,
      teacherSubject,
      isActive,
    });

    if (role === "student" && studentClass) {
      await Class.findByIdAndUpdate(studentClass, { $addToSet: { students: newUser._id } });
    }
    if (role === "teacher" && assignedClass) {
      await Class.findByIdAndUpdate(assignedClass, { classTeacher: newUser._id });
    }

    if (newUser) {
      // we don't have req.user type defined, so we use a type assertion
       if ((req as any).user) {
         await logActivity({
           userId: (req as any).user._id,
           action: "Registered User",
           details: `Registered user with email: ${newUser.email}`,
         });
       }
      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        studentClass: newUser.studentClass,
        teacherSubject: newUser.teacherSubject,
        message: "User registered successfully",
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawEmail = req.body.email;
    const password = req.body.password;
    const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const emailEscaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const user = await User.findOne({
      email: new RegExp(`^${emailEscaped}$`, "i"),
    });

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    if (user.isActive === false) {
      res.status(403).json({ message: "This account is disabled." });
      return;
    }

    if (!(await user.matchPassword(password))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    generateToken(user.id.toString(), res);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
    user.teacherSubject = req.body.teacherSubject || user.teacherSubject;
    if (req.body.password) {
      user.password = req.body.password;
    }

    // Sync class assignment for students
    const newClassId = req.body.studentClass;
    if (user.role === "student" && newClassId !== undefined) {
      const oldClassId = user.studentClass ? user.studentClass.toString() : null;
      const newClassIdStr = newClassId ? newClassId.toString() : null;

      if (oldClassId !== newClassIdStr) {
        // Remove from old class
        if (oldClassId) {
          await Class.findByIdAndUpdate(oldClassId, { $pull: { students: user._id } });
        }
        // Add to new class
        if (newClassIdStr && mongoose.isValidObjectId(newClassIdStr)) {
          await Class.findByIdAndUpdate(newClassIdStr, { $addToSet: { students: user._id } });
        }
      }
      user.studentClass = newClassId || undefined;
    }

    const updatedUser = await user.save();

    if ((req as any).user) {
      await logActivity({
        userId: (req as any).user._id.toString(),
        action: "Updated User",
        details: `Updated user with email: ${updatedUser.email}`,
      });
    }

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      studentClass: updatedUser.studentClass,
      teacherSubject: updatedUser.teacherSubject,
      message: "User updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Get all users (With Pagination & Filtering)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Parse Query Params safely
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;
    const search = req.query.search as string;
    const classId = req.query.classId as string;

    const skip = (page - 1) * limit;

    // 2. Build Filter Object
    const filter: any = {};

    if (role && role !== "all" && role !== "") {
      filter.role = role;
    }

    if (classId && mongoose.isValidObjectId(classId)) {
      filter.studentClass = new mongoose.Types.ObjectId(classId);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    // 3. Fetch Users with Pagination & Filtering
    const [total, users] = await Promise.all([
      User.countDocuments(filter), // Get total count for pagination logic
      User.find(filter)
        .select("-password")
        .populate("children", "name")
        .populate("studentClass", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // 4. Send Response
    res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};


// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      if ((req as any).user) {
        
        await logActivity({
          userId: (req as any).user._id.toString(),
          action: "Deleted User",
          details: `Deleted user with email: ${user.email}`,
        });
      }
      res.json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Get user profile (via cookie)
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    let studentClass: unknown = (req.user as any).studentClass ?? null;

    // If user.studentClass is missing (data inconsistency), fall back to the Class collection
    if (!studentClass && req.user.role === "student") {
      const cls = await Class.findOne({ students: req.user._id }, "_id").lean();
      if (cls) {
        studentClass = cls._id;
        // Heal the user document in the background
        User.findByIdAndUpdate(req.user._id, { studentClass: cls._id }).exec().catch(() => {});
      }
    }

    res.json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        studentClass: studentClass ?? null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Set children for a parent (admin only)
// @route   PUT /api/users/:id/children
// @access  Private/Admin
export const setParentChildren = async (req: AuthRequest, res: Response) => {
  try {
    const parent = await User.findById(req.params.id);
    if (!parent) return res.status(404).json({ message: "User not found" });
    if (parent.role !== "parent") return res.status(400).json({ message: "User is not a parent" });

    const { childrenIds } = req.body;
    if (!Array.isArray(childrenIds)) return res.status(400).json({ message: "childrenIds must be an array" });

    parent.children = childrenIds;
    await parent.save();

    const populated = await User.findById(parent._id)
      .populate("children", "name email studentClass")
      .lean();

    await logActivity({ userId: req.user!._id.toString(), action: `Updated children for parent ${parent.name}` });
    res.json({ message: "Children updated", children: (populated as any)?.children ?? [] });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Get parent's linked children with class info
// @route   GET /api/users/my-children
// @access  Private/Parent
export const getMyChildren = async (req: AuthRequest, res: Response) => {
  try {
    const parent = await User.findById(req.user!._id)
      .populate({ path: "children", select: "name email studentClass", populate: { path: "studentClass", select: "name" } })
      .lean();

    res.json({ children: (parent as any)?.children ?? [] });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Get a student's aggregated performance metrics (for teacher/admin)
// @route   GET /api/users/:id/performance
// @access  Private (teacher, admin)
export const getStudentPerformance = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.id;
    if (!mongoose.isValidObjectId(studentId))
      return res.status(400).json({ message: "Invalid student id" });

    // Submissions → per-subject scores
    const subs = await Submission.find({ student: studentId })
      .populate({ path: "exam", select: "questions class subject", populate: { path: "subject", select: "name" } })
      .lean();

    // Build per-subject score map
    const subjectMap = new Map<string, { name: string; scores: number[] }>();
    let examScoreSum = 0;
    let examScoreCount = 0;

    for (const sub of subs) {
      const ex = sub.exam as { questions?: { points?: number }[]; subject?: { _id?: unknown; name?: string } | string } | null;
      const maxScore = Array.isArray(ex?.questions)
        ? ex!.questions.reduce((s, q) => s + (q.points ?? 1), 0)
        : 0;
      if (maxScore <= 0) continue;

      const pct = Math.round((sub.score / maxScore) * 100);
      examScoreSum += pct;
      examScoreCount++;

      // Track per-subject
      const subj = ex?.subject;
      if (subj && typeof subj === "object" && (subj as { _id?: unknown }).name !== undefined) {
        const subjDoc = subj as { _id?: unknown; name?: string };
        const key = String(subjDoc._id ?? subjDoc.name ?? "unknown");
        const name = subjDoc.name ?? "Unknown";
        if (!subjectMap.has(key)) subjectMap.set(key, { name, scores: [] });
        subjectMap.get(key)!.scores.push(pct);
      }
    }

    const examScore = examScoreCount > 0 ? Math.round(examScoreSum / examScoreCount) : null;

    // Aggregate per-subject averages
    const subjectScores = [...subjectMap.values()].map(({ name, scores }) => ({
      subject: name,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      attempts: scores.length,
    })).sort((a, b) => a.avgScore - b.avgScore); // weakest first

    // Weakest subject = best recommendation
    const weakestSubject = subjectScores.length > 0 ? subjectScores[0] : null;

    // Attendance → rate
    const attendanceRecords = await Attendance.find({ student: studentId }).lean();
    const totalAtt = attendanceRecords.length;
    const presentAtt = attendanceRecords.filter((r) => r.status === "present" || r.status === "late").length;
    const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : null;

    // Course progress = how many of the class's active exams the student submitted
    let courseProgress: number | null = null;
    const student = await User.findById(studentId).lean();
    if (student && (student as any).studentClass) {
      const totalExams = await Exam.countDocuments({
        class: (student as any).studentClass,
        isActive: true,
      });
      if (totalExams > 0) {
        courseProgress = Math.round(Math.min((subs.length / totalExams) * 100, 100));
      }
    }

    return res.json({
      examScore,           // 0–100 overall average %, null if no submissions
      attendanceRate,      // 0–100 %, null if no records
      quizAttempts: subs.length,
      courseProgress,      // 0–100 %, null if unknown
      subjectScores,       // [{ subject, avgScore, attempts }] weakest first
      weakestSubject: weakestSubject ? weakestSubject.subject : null,
      hasData: subs.length > 0 || attendanceRecords.length > 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
export const logoutUser = async (_req: Request, res: Response) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0), //expire the cookie immediately
    });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};