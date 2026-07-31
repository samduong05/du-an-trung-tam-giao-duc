const mongoose = require("mongoose");

const User = require("../models/User.model");
const Class = require("../models/Class.model");

const populateClass = async (classId) => {
  return Class.findById(classId)
    .populate("teacher", "name email role phone isActive")
    .populate("students", "name email role phone isActive");
};

const canManageClassStudents = (req, classData) => {
  if (req.user.role === "admin") {
    return true;
  }

  return (
    req.user.role === "teacher" &&
    classData.teacher.toString() === req.user._id.toString()
  );
};

// GET /api/v1/classes/:id/available-students
const getAvailableStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { search } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "ID lớp học không hợp lệ",
      });
    }

    const classData = await Class.findById(id).select("teacher students");

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học",
      });
    }

    if (!canManageClassStudents(req, classData)) {
      return res.status(403).json({
        message: "Teacher chỉ được xem học sinh của lớp mình phụ trách",
      });
    }

    const filter = {
      role: "student",
      isActive: true,
      _id: {
        $nin: classData.students,
      },
    };

    if (typeof search === "string" && search.trim()) {
      const searchValue = search.trim();

      filter.$or = [
        {
          name: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          email: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: searchValue,
            $options: "i",
          },
        },
      ];
    }

    const students = await User.find(filter)
      .select("_id name email phone role isActive")
      .sort({ name: 1 });

    return res.status(200).json({
      message: "Lấy danh sách học sinh có thể thêm thành công",
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Lỗi lấy học sinh có thể thêm:", error);

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// POST /api/v1/classes/:id/students
const addStudentToClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "ID lớp học không hợp lệ",
      });
    }

    if (!studentId) {
      return res.status(400).json({
        message: "Vui lòng nhập studentId",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        message: "ID học sinh không hợp lệ",
      });
    }

    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học",
      });
    }

    if (!canManageClassStudents(req, classData)) {
      return res.status(403).json({
        message: "Teacher chỉ được thêm học sinh vào lớp mình phụ trách",
      });
    }

    const student = await User.findOne({
      _id: studentId,
      role: "student",
      isActive: true,
    }).select("_id");

    if (!student) {
      return res.status(400).json({
        message: "Không tìm thấy học sinh đang hoạt động hợp lệ",
      });
    }

    const isStudentInClass = classData.students.some(
      (currentStudentId) =>
        currentStudentId.toString() === student._id.toString(),
    );

    if (isStudentInClass) {
      return res.status(400).json({
        message: "Học sinh đã có trong lớp",
      });
    }

    classData.students.push(student._id);

    await classData.save();

    const updatedClass = await populateClass(classData._id);

    return res.status(200).json({
      message: "Thêm học sinh vào lớp thành công",
      class: updatedClass,
    });
  } catch (error) {
    console.error("Lỗi thêm học sinh vào lớp:", error);

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// DELETE /api/v1/classes/:id/students/:studentId
const removeStudentFromClass = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "ID lớp học không hợp lệ",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        message: "ID học sinh không hợp lệ",
      });
    }

    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học",
      });
    }

    if (!canManageClassStudents(req, classData)) {
      return res.status(403).json({
        message: "Teacher chỉ được gỡ học sinh khỏi lớp mình phụ trách",
      });
    }

    const isStudentInClass = classData.students.some(
      (currentStudentId) => currentStudentId.toString() === studentId,
    );

    if (!isStudentInClass) {
      return res.status(400).json({
        message: "Học sinh không có trong lớp",
      });
    }

    classData.students = classData.students.filter(
      (currentStudentId) => currentStudentId.toString() !== studentId,
    );

    await classData.save();

    const updatedClass = await populateClass(classData._id);

    return res.status(200).json({
      message: "Gỡ học sinh khỏi lớp thành công",
      class: updatedClass,
    });
  } catch (error) {
    console.error("Lỗi gỡ học sinh khỏi lớp:", error);

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};

module.exports = {
  getAvailableStudents,
  addStudentToClass,
  removeStudentFromClass,
};
