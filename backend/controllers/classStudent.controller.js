const User = require("../models/User.model");
const Class = require("../models/Class.model");

// POST /api/v1/classes/:id/students
const addStudentToClass = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        message: "Vui lòng nhập studentId",
      });
    }

    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học",
      });
    }

    // Teacher chỉ được thêm học sinh vào lớp mình phụ trách
    if (
      req.user.role === "teacher" &&
      classData.teacher.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Teacher chỉ được thêm học sinh vào lớp mình phụ trách",
      });
    }

    const student = await User.findOne({
      _id: studentId,
      role: "student",
    });

    if (!student) {
      return res.status(400).json({
        message: "Không tìm thấy học sinh hợp lệ",
      });
    }

    const isStudentInClass = classData.students.some(
      (id) => id.toString() === student._id.toString(),
    );

    if (isStudentInClass) {
      return res.status(400).json({
        message: "Học sinh đã có trong lớp",
      });
    }

    classData.students.push(student._id);
    await classData.save();

    const updatedClass = await Class.findById(classData._id)
      .populate("teacher", "name email role phone")
      .populate("students", "name email role phone");

    return res.json({
      message: "Thêm học sinh vào lớp thành công",
      class: updatedClass,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// DELETE /api/v1/classes/:id/students/:studentId
const removeStudentFromClass = async (req, res) => {
  try {
    const { studentId } = req.params;

    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học",
      });
    }

    // Teacher chỉ được gỡ học sinh khỏi lớp mình phụ trách
    if (
      req.user.role === "teacher" &&
      classData.teacher.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Teacher chỉ được gỡ học sinh khỏi lớp mình phụ trách",
      });
    }

    const isStudentInClass = classData.students.some(
      (id) => id.toString() === studentId,
    );

    if (!isStudentInClass) {
      return res.status(400).json({
        message: "Học sinh không có trong lớp",
      });
    }

    classData.students = classData.students.filter(
      (id) => id.toString() !== studentId,
    );

    await classData.save();

    const updatedClass = await Class.findById(classData._id)
      .populate("teacher", "name email role phone")
      .populate("students", "name email role phone");

    return res.json({
      message: "Gỡ học sinh khỏi lớp thành công",
      class: updatedClass,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

module.exports = {
  addStudentToClass,
  removeStudentFromClass,
};
