import { type Request, type Response } from "express";
import Class from "../models/class.ts";
import User from "../models/user.ts";
import { logActivity } from "../utils/activitieslog.ts";
import mongoose from "mongoose";

// @desc    Create a new Class
// @route   POST /api/classes
// @access  Private/Admin
export const createClass = async (req: Request, res: Response) => {
  try {
    const { name, academicYear, classTeacher, capacity } = req.body;

    const existingClass = await Class.findOne({ name, academicYear });
    if (existingClass) {
      return res.status(400).json({
        message:
          "Class with this name already exists for the specified academic year.",
      });
    }

    const newClass = await Class.create({
      name,
      academicYear,
      classTeacher,
      capacity,
    });
    await logActivity({
      userId: (req as any).user.id,
      action: `Created new class: ${newClass.name}`,
    });
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: (error as any)?.message || "Server Error" });
  }
};

// @desc    Get All Classes
// @route   GET /api/classes
// @access  Private
export const getAllClasses = async (req: Request, res: Response) => {
  try {
    // 1. Parse Query Parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    // 2. Build Search Query (Case-insensitive regex on Name)
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    // 3. Execute Query (Count & Find)
    const [total, classes] = await Promise.all([
      Class.countDocuments(query),
      Class.find(query)
        .populate("academicYear", "name")
        .populate("classTeacher", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    // 4. Return Data + Pagination Meta
    res.json({
      classes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: (error as any)?.message || "Server Error" });
  }
};

// @desc    Update Class
// @route   PUT /api/classes/:id
// @access  Private/Admin
export const updateClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, academicYear } = req.body;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const objectId = new mongoose.Types.ObjectId(id);

    const updatedClass = await Class.findByIdAndUpdate(objectId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    await logActivity({
      userId: (req as any).user.id,
      action: `Updated class: ${updatedClass.name}`,
    });

    return res.status(200).json(updatedClass);
  } catch (error: any) {
    // ✅ handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Class with this name already exists in this academic year",
        fields: error.keyValue, // optional (بيعطيك القيم المكررة)
      });
    }

    return res.status(500).json({
      message: "Server Error",
      error,
    });
  }
};
// @desc    Get students enrolled in a class
// @route   GET /api/classes/:id/students
// @access  Private (admin, teacher)
export const getClassStudents = async (req: Request, res: Response) => {
  try {
    const cls = await Class.findById(req.params.id)
      .populate("students", "name email isActive")
      .lean();
    if (!cls) return res.status(404).json({ message: "Class not found" });
    res.json({ students: (cls as any).students ?? [] });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Set students enrolled in a class (admin only)
// @route   PUT /api/classes/:id/students
// @access  Private/Admin
export const setClassStudents = async (req: Request, res: Response) => {
  try {
    const classId = req.params.id;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ message: "studentIds must be an array" });
    }

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const oldIds = (cls.students ?? []).map(String);
    const newIds = studentIds.map(String);

    const toRemove = oldIds.filter((id) => !newIds.includes(id));
    const toAdd = newIds.filter((id) => !oldIds.includes(id));

    cls.students = studentIds as any;
    await cls.save();

    if (toRemove.length) {
      await User.updateMany(
        { _id: { $in: toRemove }, studentClass: classId },
        { $unset: { studentClass: 1 } }
      );
    }
    if (toAdd.length) {
      await User.updateMany(
        { _id: { $in: toAdd } },
        { $set: { studentClass: classId } }
      );
    }

    res.json({ message: "Students updated", count: studentIds.length });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Delete Class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
export const deleteClass = async (req: Request, res: Response) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    const userId = (req as any).user._id;
    await logActivity({
      userId,
      action: `Deleted class: ${deletedClass?.name}`,
    });
    if (!deletedClass) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.json({ message: "Class removed" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};