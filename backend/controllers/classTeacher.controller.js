const User = require("../models/User.model");
const Class = require("../models/Class.model");
const {
  CONFLICT_TYPES,
  findClassScheduleConflicts,
} = require("../utils/classScheduleConflict.utils");

const assignTeacherToClass = async (req, res) => {
  try {
    const { teacherId, forceSave = false } = req.body;

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

    /*
     * Chỉ kiểm tra xung đột giáo viên.
     *
     * Không kiểm tra lại học sinh và phòng vì thao tác này
     * chỉ thay đổi giáo viên phụ trách.
     */
    if (forceSave !== true) {
      const conflicts = await findClassScheduleConflicts(
        {
          teacherId: teacher._id,
          studentIds: [],
          schedule: classData.schedule,
          status: classData.status,
          startedAt: classData.startedAt,
          endedAt: classData.endedAt,
        },
        {
          excludeClassId: classData._id,
          conflictTypes: [CONFLICT_TYPES.TEACHER],
        },
      );

      if (conflicts.length > 0) {
        return res.status(409).json({
          message: "Phát hiện xung đột lịch",
          requiresConfirmation: true,
          conflictCount: conflicts.length,
          conflicts,
        });
      }
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
