const User = require("../models/User.model");
const Class = require("../models/Class.model");
const assignTeacherToClass = async (req, res) => {
  try {
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({
        message: "Vui lòng nhập teacherId",
      });
    }

    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học",
      });
    }

    const teacher = await User.findOne({
      _id: teacherId,
      role: "teacher",
    });

    if (!teacher) {
      return res.status(400).json({
        message: "Không tìm thấy giáo viên hợp lệ",
      });
    }

    if (classData.teacher.toString() === teacher._id.toString()) {
      return res.status(400).json({
        message: "Giáo viên này đang phụ trách lớp",
      });
    }

    classData.teacher = teacher._id;
    await classData.save();

    const updatedClass = await Class.findById(classData._id)
      .populate("teacher", "name email role phone")
      .populate("students", "name email role phone");

    return res.json({
      message: "Thay giáo viên phụ trách lớp thành công",
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
  assignTeacherToClass,
};
