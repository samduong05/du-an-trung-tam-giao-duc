const User = require("../models/User.model");
const Class = require("../models/Class.model");

// GET /api/v1/classes
const getClasses = async (req, res) => {
  try {
    const { status, search } = req.query;

    const filter = {};

    // Teacher chỉ xem lớp mình dạy
    if (req.user.role === "teacher") {
      filter.teacher = req.user._id;
    }

    // Lọc theo trạng thái lớp nếu có
    if (status) {
      if (!["active", "paused", "completed"].includes(status)) {
        return res.status(400).json({
          message: "Trạng thái lớp không hợp lệ",
        });
      }

      filter.status = status;
    }

    // Tìm kiếm theo tên lớp
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const classes = await Class.find(filter)
      .populate("teacher", "name email role phone")
      .populate("students", "name email role phone")
      .sort({ createdAt: -1 });

    return res.json({
      message: "Lấy danh sách lớp thành công",
      count: classes.length,
      classes,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// GET /api/v1/classes/:id
const getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate("teacher", "name email role phone")
      .populate("students", "name email role phone");

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học",
      });
    }

    // Teacher chỉ xem lớp mình phụ trách
    if (
      req.user.role === "teacher" &&
      classData.teacher._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Teacher chỉ được xem lớp mình phụ trách",
      });
    }

    return res.json({
      message: "Lấy chi tiết lớp thành công",
      class: classData,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// POST /api/v1/classes
const createClass = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Chỉ admin được tạo lớp học",
      });
    }

    const {
      name,
      subject,
      description,
      schedule,
      teacherId,
      students,
      status,
      startedAt,
      endedAt,
    } = req.body;

    if (!name || !subject || !teacherId) {
      return res.status(400).json({
        message: "Vui lòng nhập tên lớp, môn học và teacherId",
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

    let studentIds = [];

    if (Array.isArray(students) && students.length > 0) {
      const foundStudents = await User.find({
        _id: { $in: students },
        role: "student",
      }).select("_id");

      if (foundStudents.length !== students.length) {
        return res.status(400).json({
          message: "Danh sách học sinh có id không hợp lệ",
        });
      }

      studentIds = foundStudents.map((student) => student._id);
    }

    if (status && !["active", "paused", "completed"].includes(status)) {
      return res.status(400).json({
        message: "Trạng thái lớp không hợp lệ",
      });
    }

    const newClass = await Class.create({
      name,
      subject,
      description,
      schedule,
      teacher: teacher._id,
      students: studentIds,
      status,
      startedAt,
      endedAt,
    });

    const classData = await Class.findById(newClass._id)
      .populate("teacher", "name email role phone")
      .populate("students", "name email role phone");

    return res.status(201).json({
      message: "Tạo lớp học thành công",
      class: classData,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// PUT /api/v1/classes/:id
const updateClass = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Chỉ admin được cập nhật lớp học",
      });
    }

    const {
      name,
      subject,
      description,
      schedule,
      teacherId,
      students,
      status,
      startedAt,
      endedAt,
    } = req.body;

    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học",
      });
    }
    if (subject !== undefined) {
      classData.subject = subject;
    }
    if (teacherId) {
      const teacher = await User.findOne({
        _id: teacherId,
        role: "teacher",
      });

      if (!teacher) {
        return res.status(400).json({
          message: "Không tìm thấy giáo viên hợp lệ",
        });
      }

      classData.teacher = teacher._id;
    }

    if (Array.isArray(students)) {
      const foundStudents = await User.find({
        _id: { $in: students },
        role: "student",
      }).select("_id");

      if (foundStudents.length !== students.length) {
        return res.status(400).json({
          message: "Danh sách học sinh có id không hợp lệ",
        });
      }

      classData.students = foundStudents.map((student) => student._id);
    }

    if (status) {
      if (!["active", "paused", "completed"].includes(status)) {
        return res.status(400).json({
          message: "Trạng thái lớp không hợp lệ",
        });
      }

      classData.status = status;
    }

    if (name) classData.name = name;
    if (description !== undefined) classData.description = description;
    if (schedule !== undefined) classData.schedule = schedule;
    if (startedAt !== undefined) classData.startedAt = startedAt;
    if (endedAt !== undefined) classData.endedAt = endedAt;

    await classData.save();

    const updatedClass = await Class.findById(classData._id)
      .populate("teacher", "name email role phone")
      .populate("students", "name email role phone");

    return res.json({
      message: "Cập nhật lớp học thành công",
      class: updatedClass,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// PATCH /api/v1/classes/:id/status
const updateClassStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Chỉ admin được đổi trạng thái lớp học",
      });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Vui lòng nhập status",
      });
    }

    if (!["active", "paused", "completed"].includes(status)) {
      return res.status(400).json({
        message: "Trạng thái lớp không hợp lệ",
      });
    }

    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học",
      });
    }

    classData.status = status;

    if (status === "completed") {
      classData.endedAt = new Date();
    }

    await classData.save();

    const updatedClass = await Class.findById(classData._id)
      .populate("teacher", "name email role phone")
      .populate("students", "name email role phone");

    return res.json({
      message: "Cập nhật trạng thái lớp thành công",
      class: updatedClass,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// DELETE /api/v1/classes/:id
const deleteClass = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Chỉ admin được xóa lớp học",
      });
    }

    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học",
      });
    }

    await Class.findByIdAndDelete(req.params.id);

    return res.json({
      message: "Xóa lớp học thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  updateClassStatus,
  deleteClass,
};
