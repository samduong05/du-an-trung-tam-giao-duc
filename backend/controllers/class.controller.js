const User = require("../models/User.model");
const Class = require("../models/Class.model");
const {
  findClassScheduleConflicts,
} = require("../utils/classScheduleConflict.utils");

const sendScheduleConflictResponse = (res, conflicts) => {
  return res.status(409).json({
    message: "Phát hiện xung đột lịch",
    requiresConfirmation: true,
    conflictCount: conflicts.length,
    conflicts,
  });
};
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
// GET /api/v1/classes/my-classes
// Student chỉ xem những lớp có mình trong danh sách students
const getMyClasses = async (req, res) => {
  try {
    const { status, search } = req.query;

    const filter = {
      students: req.user._id,
    };

    if (status) {
      if (!["active", "paused", "completed"].includes(status)) {
        return res.status(400).json({
          message: "Trạng thái lớp không hợp lệ",
        });
      }

      filter.status = status;
    }

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    const classes = await Class.find(filter)
      .populate("teacher", "name email role phone")
      .sort({ createdAt: -1 });

    return res.json({
      message: "Lấy danh sách lớp của học sinh thành công",
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

// GET /api/v1/classes/my-classes/:id
// Student chỉ được xem chi tiết lớp có chứa mình
const getMyClassById = async (req, res) => {
  try {
    const classData = await Class.findOne({
      _id: req.params.id,
      students: req.user._id,
    }).populate("teacher", "name email role phone");

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học hoặc bạn không thuộc lớp này",
      });
    }

    return res.json({
      message: "Lấy chi tiết lớp của học sinh thành công",
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
      forceSave = false,
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
        _id: {
          $in: students,
        },
        role: "student",
      }).select("_id");

      if (foundStudents.length !== students.length) {
        return res.status(400).json({
          message: "Danh sách học sinh có id không hợp lệ",
        });
      }

      studentIds = foundStudents.map((student) => student._id);
    }

    const classStatus = status ?? "active";

    if (!["active", "paused", "completed"].includes(classStatus)) {
      return res.status(400).json({
        message: "Trạng thái lớp không hợp lệ",
      });
    }

    /*
     * Chỉ bỏ qua cảnh báo khi Admin đã xác nhận forceSave = true.
     */
    if (forceSave !== true) {
      const conflicts = await findClassScheduleConflicts({
        teacherId: teacher._id,
        studentIds,
        schedule: Array.isArray(schedule) ? schedule : [],
        status: classStatus,
        startedAt,
        endedAt,
      });

      if (conflicts.length > 0) {
        return sendScheduleConflictResponse(res, conflicts);
      }
    }

    const newClass = await Class.create({
      name,
      subject,
      description,
      schedule,
      teacher: teacher._id,
      students: studentIds,
      status: classStatus,
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
      forceSave = false,
    } = req.body;

    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học",
      });
    }

    /*
     * Tạo dữ liệu dự kiến sau cập nhật.
     *
     * Phải kiểm tra conflict trên dữ liệu mới,
     * nhưng chưa được ghi vào database.
     */
    let proposedTeacherId = classData.teacher;

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

      proposedTeacherId = teacher._id;
    }

    let proposedStudentIds = classData.students;

    if (Array.isArray(students)) {
      const foundStudents = await User.find({
        _id: {
          $in: students,
        },
        role: "student",
      }).select("_id");

      if (foundStudents.length !== students.length) {
        return res.status(400).json({
          message: "Danh sách học sinh có id không hợp lệ",
        });
      }

      proposedStudentIds = foundStudents.map((student) => student._id);
    }

    const proposedStatus = status !== undefined ? status : classData.status;

    if (!["active", "paused", "completed"].includes(proposedStatus)) {
      return res.status(400).json({
        message: "Trạng thái lớp không hợp lệ",
      });
    }

    const proposedSchedule =
      schedule !== undefined ? schedule : classData.schedule;

    const proposedStartedAt =
      startedAt !== undefined ? startedAt || null : classData.startedAt;

    const proposedEndedAt =
      endedAt !== undefined ? endedAt || null : classData.endedAt;

    /*
     * Khi sửa lớp phải loại chính lớp đang sửa.
     */
    if (forceSave !== true) {
      const conflicts = await findClassScheduleConflicts(
        {
          teacherId: proposedTeacherId,
          studentIds: proposedStudentIds,
          schedule: proposedSchedule,
          status: proposedStatus,
          startedAt: proposedStartedAt,
          endedAt: proposedEndedAt,
        },
        {
          excludeClassId: classData._id,
        },
      );

      if (conflicts.length > 0) {
        return sendScheduleConflictResponse(res, conflicts);
      }
    }

    /*
     * Chỉ cập nhật document sau khi:
     * - không có conflict; hoặc
     * - Admin đã gửi forceSave = true.
     */
    if (name !== undefined) {
      classData.name = name;
    }

    if (subject !== undefined) {
      classData.subject = subject;
    }

    if (description !== undefined) {
      classData.description = description;
    }

    if (teacherId) {
      classData.teacher = proposedTeacherId;
    }

    if (Array.isArray(students)) {
      classData.students = proposedStudentIds;
    }

    if (schedule !== undefined) {
      classData.schedule = schedule;
    }

    if (status !== undefined) {
      classData.status = proposedStatus;
    }

    if (startedAt !== undefined) {
      classData.startedAt = startedAt || null;
    }

    if (endedAt !== undefined) {
      classData.endedAt = endedAt || null;
    }

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
  getMyClasses,
  getMyClassById,
  createClass,
  updateClass,
  updateClassStatus,
  deleteClass,
};
