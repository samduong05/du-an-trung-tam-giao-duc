const Attendance = require("../models/Attendance.model");
const Class = require("../models/Class.model");
const User = require("../models/User.model");

const normalizeDate = (date) => {
  const normalizedDate = new Date(date);

  if (Number.isNaN(normalizedDate.getTime())) {
    return null;
  }

  normalizedDate.setHours(0, 0, 0, 0);

  return normalizedDate;
};

const isSameId = (firstId, secondId) => {
  return firstId?.toString() === secondId?.toString();
};

const checkClassPermission = (req, classData) => {
  // Admin được thao tác với tất cả lớp
  if (req.user.role === "admin") {
    return true;
  }

  // Teacher chỉ được thao tác với lớp mình phụ trách
  if (req.user.role === "teacher") {
    return isSameId(classData.teacher, req.user._id);
  }

  return false;
};

const calculateReportSummary = (details) => {
  return {
    total: details.length,

    present: details.filter((item) => item.status === "present").length,
    late: details.filter((item) => item.status === "late").length,
    excused: details.filter((item) => item.status === "excused").length,
    absent: details.filter((item) => item.status === "absent").length,
  };
};

// POST /api/v1/attendance/classes/:classId/mark
const markAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, records = [], remarks = "" } = req.body;

    if (!date) {
      return res.status(400).json({
        message: "Vui lòng nhập ngày điểm danh",
      });
    }

    const attendanceDate = normalizeDate(date);

    if (!attendanceDate) {
      return res.status(400).json({
        message: "Ngày điểm danh không hợp lệ",
      });
    }

    if (!Array.isArray(records)) {
      return res.status(400).json({
        message: "records phải là một mảng",
      });
    }

    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học",
      });
    }

    if (!checkClassPermission(req, classData)) {
      return res.status(403).json({
        message: "Bạn không có quyền điểm danh lớp này",
      });
    }
    if (!classData.subject) {
      return res.status(400).json({
        message: "Lớp học này chưa có tên môn học",
      });
    }

    const classStudentIds = classData.students.map((studentId) =>
      studentId.toString(),
    );

    const invalidStudentRecord = records.find((record) => {
      if (!record.studentId) {
        return true;
      }

      return !classStudentIds.includes(record.studentId.toString());
    });

    if (invalidStudentRecord) {
      return res.status(400).json({
        message: "Có học sinh không hợp lệ hoặc không thuộc lớp này",
      });
    }

    const allowedStatuses = ["present", "late", "excused", "absent"];

    const invalidStatusRecord = records.find(
      (record) => record.status && !allowedStatuses.includes(record.status),
    );

    if (invalidStatusRecord) {
      return res.status(400).json({
        message: "Trạng thái điểm danh không hợp lệ",
      });
    }

    const recordMap = new Map();

    records.forEach((record) => {
      recordMap.set(record.studentId.toString(), {
        status: record.status || "absent",
        note: record.note?.trim() || "",
      });
    });

    /*
     * Tạo đủ bản ghi theo danh sách học sinh của lớp.
     * Học sinh không được gửi lên sẽ mặc định là absent.
     */
    const finalRecords = classStudentIds.map((studentId) => {
      const submittedRecord = recordMap.get(studentId);

      return {
        studentId,
        status: submittedRecord?.status || "absent",
        note: submittedRecord?.note || "",
      };
    });

    let attendance = await Attendance.findOne({
      classId,
      date: attendanceDate,
    });

    if (attendance?.isFinalized) {
      return res.status(400).json({
        message: "Buổi điểm danh này đã được chốt, không thể sửa",
      });
    }

    if (attendance) {
      attendance.subject = classData.subject;
      attendance.teacherId = classData.teacher;
      attendance.records = finalRecords;
      attendance.remarks = remarks.trim();

      await attendance.save();
    } else {
      attendance = await Attendance.create({
        classId,
        subject: classData.subject,
        teacherId: classData.teacher,
        date: attendanceDate,
        records: finalRecords,
        remarks: remarks.trim(),
      });
    }

    const result = await Attendance.findById(attendance._id)
      .populate("classId", "name description schedule subject")
      .populate("teacherId", "name email")
      .populate("records.studentId", "name email phone");

    return res.status(200).json({
      message: "Điểm danh thành công",
      attendance: result,
    });
  } catch (error) {
    console.log("Lỗi điểm danh:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "classId không hợp lệ",
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Lớp này đã có điểm danh trong ngày này",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// GET /api/v1/attendance/classes/:classId/by-date?date=2026-07-15
const getAttendanceByClassAndDate = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "Vui lòng nhập date trên query",
      });
    }

    const attendanceDate = normalizeDate(date);

    if (!attendanceDate) {
      return res.status(400).json({
        message: "Ngày điểm danh không hợp lệ",
      });
    }

    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học",
      });
    }

    if (!checkClassPermission(req, classData)) {
      return res.status(403).json({
        message: "Bạn không có quyền xem điểm danh lớp này",
      });
    }

    const attendance = await Attendance.findOne({
      classId,
      date: attendanceDate,
    })
      .populate("classId", "name description schedule subject")
      .populate("teacherId", "name email")
      .populate("records.studentId", "name email phone");

    if (!attendance) {
      return res.status(404).json({
        message: "Chưa có dữ liệu điểm danh cho lớp này trong ngày này",
      });
    }

    return res.status(200).json({
      message: "Lấy điểm danh theo lớp và ngày thành công",
      attendance,
    });
  } catch (error) {
    console.log("Lỗi lấy điểm danh theo ngày:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "classId không hợp lệ",
      });
    }

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// PATCH /api/v1/attendance/:attendanceId/finalize
const finalizeAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({
        message: "Không tìm thấy bản điểm danh",
      });
    }

    if (attendance.isFinalized) {
      return res.status(400).json({
        message: "Buổi điểm danh này đã được chốt trước đó",
      });
    }

    const classData = await Class.findById(attendance.classId);

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học của bản điểm danh này",
      });
    }

    if (!checkClassPermission(req, classData)) {
      return res.status(403).json({
        message: "Bạn không có quyền chốt điểm danh lớp này",
      });
    }

    attendance.isFinalized = true;

    await attendance.save();

    const result = await Attendance.findById(attendance._id)
      .populate("classId", "name description schedule subject")
      .populate("teacherId", "name email")
      .populate("records.studentId", "name email phone");

    return res.status(200).json({
      message: "Chốt điểm danh thành công",
      attendance: result,
    });
  } catch (error) {
    console.log("Lỗi chốt điểm danh:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "attendanceId không hợp lệ",
      });
    }

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// GET /api/v1/attendance/students/:studentId/report?from=2026-07-01&to=2026-07-31
const getStudentAttendanceReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { from, to, classId } = req.query;

    const student = await User.findById(studentId).select("-password");

    if (!student) {
      return res.status(404).json({
        message: "Không tìm thấy học sinh",
      });
    }

    if (student.role !== "student") {
      return res.status(400).json({
        message: "Người dùng này không phải học sinh",
      });
    }

    /*
     * Student chỉ được xem báo cáo của chính mình.
     * Admin xem được tất cả học sinh.
     * Teacher chỉ xem học sinh thuộc lớp mình dạy.
     */
    if (req.user.role === "student" && !isSameId(req.user._id, studentId)) {
      return res.status(403).json({
        message: "Bạn chỉ được xem báo cáo điểm danh của chính mình",
      });
    }
    let selectedClass = null;

    if (classId) {
      selectedClass = await Class.findById(classId).select(
        "name description subject teacher students schedule status",
      );

      if (!selectedClass) {
        return res.status(404).json({
          message: "Không tìm thấy lớp học",
        });
      }

      const belongsToClass = selectedClass.students.some((classStudentId) =>
        isSameId(classStudentId, studentId),
      );

      if (!belongsToClass) {
        return res.status(403).json({
          message: "Học sinh không thuộc lớp học này",
        });
      }

      /*
       * Teacher chỉ được xem báo cáo trong lớp mình phụ trách.
       */
      if (
        req.user.role === "teacher" &&
        !isSameId(selectedClass.teacher, req.user._id)
      ) {
        return res.status(403).json({
          message: "Bạn không có quyền xem báo cáo của lớp này",
        });
      }
    }

    /*
     * Student phải mở báo cáo từ một lớp cụ thể,
     * không được xem dữ liệu gộp của nhiều lớp.
     */
    if (req.user.role === "student" && !classId) {
      return res.status(400).json({
        message: "Vui lòng chọn lớp học cần xem chuyên cần",
      });
    }
    const filter = {
      "records.studentId": studentId,
      isFinalized: true,
    };
    if (classId) {
      filter.classId = classId;
    }
    if (from || to) {
      filter.date = {};

      if (from) {
        const fromDate = normalizeDate(from);

        if (!fromDate) {
          return res.status(400).json({
            message: "Ngày from không hợp lệ",
          });
        }

        filter.date.$gte = fromDate;
      }

      if (to) {
        const toDate = normalizeDate(to);

        if (!toDate) {
          return res.status(400).json({
            message: "Ngày to không hợp lệ",
          });
        }

        toDate.setHours(23, 59, 59, 999);
        filter.date.$lte = toDate;
      }
    }

    if (
      filter.date?.$gte &&
      filter.date?.$lte &&
      filter.date.$gte > filter.date.$lte
    ) {
      return res.status(400).json({
        message: "Ngày from không được lớn hơn ngày to",
      });
    }

    if (req.user.role === "teacher" && !classId) {
      const teacherClasses = await Class.find({
        teacher: req.user._id,
        students: studentId,
      }).select("_id");

      const teacherClassIds = teacherClasses.map((classData) => classData._id);

      if (teacherClassIds.length === 0) {
        return res.status(403).json({
          message: "Bạn không có quyền xem báo cáo điểm danh của học sinh này",
        });
      }

      filter.classId = {
        $in: teacherClassIds,
      };
    }

    const attendances = await Attendance.find(filter)
      .populate("classId", "name description schedule subject")
      .populate("teacherId", "name email")
      .populate("records.studentId", "name email phone")
      .sort({
        date: -1,
      });

    const details = [];

    attendances.forEach((attendance) => {
      const studentRecord = attendance.records.find((record) =>
        isSameId(record.studentId?._id || record.studentId, studentId),
      );

      if (!studentRecord) {
        return;
      }

      details.push({
        attendanceId: attendance._id,
        class: attendance.classId,
        subject: attendance.classId?.subject || "",
        teacher: attendance.teacherId,
        date: attendance.date,
        status: studentRecord.status,
        note: studentRecord.note,
        isFinalized: attendance.isFinalized,
        remarks: attendance.remarks,
      });
    });

    const summary = calculateReportSummary(details);

    return res.status(200).json({
      message: "Lấy báo cáo điểm danh học sinh thành công",
      student,
      class: selectedClass,
      summary,
      details,
    });
  } catch (error) {
    console.log("Lỗi lấy báo cáo điểm danh học sinh:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "studentId không hợp lệ",
      });
    }

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};
// GET /api/v1/attendance/teacher/week-status?from=2026-08-03&to=2026-08-09
const getTeacherAttendanceWeekStatus = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        message: "Vui lòng cung cấp đầy đủ ngày from và to",
      });
    }

    const fromDate = normalizeDate(from);
    const toDate = normalizeDate(to);

    if (!fromDate || !toDate) {
      return res.status(400).json({
        message: "Khoảng ngày không hợp lệ",
      });
    }

    if (fromDate > toDate) {
      return res.status(400).json({
        message: "Ngày from không được lớn hơn ngày to",
      });
    }

    /*
     * Lấy hết dữ liệu đến cuối ngày to.
     */
    toDate.setHours(23, 59, 59, 999);

    const attendances = await Attendance.find({
      teacherId: req.user._id,
      date: {
        $gte: fromDate,
        $lte: toDate,
      },
    })
      .select("_id classId date isFinalized")
      .sort({
        date: 1,
      });

    const statuses = attendances.map((attendance) => ({
      attendanceId: attendance._id,
      classId: attendance.classId,
      date: attendance.date,
      isFinalized: attendance.isFinalized,
    }));

    return res.status(200).json({
      message: "Lấy trạng thái điểm danh theo tuần thành công",
      count: statuses.length,
      statuses,
    });
  } catch (error) {
    console.log("Lỗi lấy trạng thái điểm danh theo tuần:", error);

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};
// GET /api/v1/attendance/admin/day-status?date=2026-08-03
const getAdminAttendanceDayStatus = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "Vui lòng cung cấp ngày cần xem",
      });
    }

    const attendanceDate = normalizeDate(date);

    if (!attendanceDate) {
      return res.status(400).json({
        message: "Ngày cần xem không hợp lệ",
      });
    }

    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const attendances = await Attendance.find({
      date: {
        $gte: attendanceDate,
        $lte: endOfDay,
      },
    })
      .select("_id classId date isFinalized")
      .sort({
        date: 1,
      });

    const statuses = attendances.map((attendance) => ({
      attendanceId: attendance._id,
      classId: attendance.classId,
      date: attendance.date,
      isFinalized: attendance.isFinalized,
    }));

    return res.status(200).json({
      message: "Lấy trạng thái điểm danh theo ngày thành công",
      count: statuses.length,
      statuses,
    });
  } catch (error) {
    console.log("Lỗi lấy trạng thái điểm danh theo ngày cho admin:", error);

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// GET /api/v1/attendance/classes/:classId/report?from=2026-07-01&to=2026-07-31
const getClassAttendanceReport = async (req, res) => {
  try {
    const { classId } = req.params;
    const { from, to } = req.query;

    const classData = await Class.findById(classId)
      .populate("teacher", "name email phone")
      .populate("students", "name email phone role");

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học",
      });
    }

    /*
     * Admin xem được tất cả lớp.
     * Teacher chỉ xem được lớp mình phụ trách.
     */
    if (
      req.user.role === "teacher" &&
      !isSameId(classData.teacher?._id || classData.teacher, req.user._id)
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền xem báo cáo của lớp này",
      });
    }

    const attendanceFilter = {
      classId,
      isFinalized: true,
    };

    if (from || to) {
      attendanceFilter.date = {};

      if (from) {
        const fromDate = normalizeDate(from);

        if (!fromDate) {
          return res.status(400).json({
            message: "Ngày from không hợp lệ",
          });
        }

        attendanceFilter.date.$gte = fromDate;
      }

      if (to) {
        const toDate = normalizeDate(to);

        if (!toDate) {
          return res.status(400).json({
            message: "Ngày to không hợp lệ",
          });
        }

        /*
         * Bao gồm toàn bộ ngày kết thúc.
         */
        toDate.setHours(23, 59, 59, 999);
        attendanceFilter.date.$lte = toDate;
      }
    }

    if (
      attendanceFilter.date?.$gte &&
      attendanceFilter.date?.$lte &&
      attendanceFilter.date.$gte > attendanceFilter.date.$lte
    ) {
      return res.status(400).json({
        message: "Ngày from không được lớn hơn ngày to",
      });
    }

    const attendances = await Attendance.find(attendanceFilter)
      .select("date records summary isFinalized")
      .sort({
        date: 1,
      });

    /*
     * Khởi tạo tất cả học sinh hiện có trong lớp.
     * Nhờ vậy, học sinh chưa có dữ liệu điểm danh vẫn được hiển thị.
     */
    const studentReportMap = new Map();

    classData.students.forEach((student) => {
      studentReportMap.set(student._id.toString(), {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          phone: student.phone || "",
        },

        summary: {
          total: 0,
          present: 0,
          late: 0,
          excused: 0,
          absent: 0,
        },
      });
    });

    /*
     * Chỉ cộng dữ liệu từ các buổi đã chốt.
     */
    attendances.forEach((attendance) => {
      attendance.records.forEach((record) => {
        const studentId = record.studentId.toString();
        const studentReport = studentReportMap.get(studentId);

        /*
         * Không cộng học sinh đã rời khỏi lớp
         * và không còn trong danh sách hiện tại.
         */
        if (!studentReport) {
          return;
        }

        studentReport.summary.total += 1;

        if (record.status === "present") {
          studentReport.summary.present += 1;
        }

        if (record.status === "late") {
          studentReport.summary.late += 1;
        }

        if (record.status === "excused") {
          studentReport.summary.excused += 1;
        }

        if (record.status === "absent") {
          studentReport.summary.absent += 1;
        }
      });
    });

    const students = Array.from(studentReportMap.values())
      .map((item) => {
        const attendedSessions = item.summary.present + item.summary.late;

        const attendanceRate =
          item.summary.total > 0
            ? Math.round((attendedSessions / item.summary.total) * 100)
            : 0;

        return {
          ...item,
          attendanceRate,
        };
      })
      .sort((firstStudent, secondStudent) =>
        firstStudent.student.name.localeCompare(
          secondStudent.student.name,
          "vi",
        ),
      );

    const averageAttendanceRate =
      students.length > 0
        ? Math.round(
            students.reduce(
              (total, student) => total + student.attendanceRate,
              0,
            ) / students.length,
          )
        : 0;

    return res.status(200).json({
      message: "Lấy báo cáo chuyên cần của lớp thành công",

      class: {
        _id: classData._id,
        name: classData.name,
        description: classData.description,
        subject: classData.subject,
        status: classData.status,
        startedAt: classData.startedAt,
        endedAt: classData.endedAt,
        teacher: classData.teacher,
      },

      range: {
        from: from || null,
        to: to || null,
      },

      totalSessions: attendances.length,
      totalStudents: classData.students.length,
      averageAttendanceRate,
      students,
    });
  } catch (error) {
    console.log("Lỗi lấy báo cáo chuyên cần của lớp:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "classId không hợp lệ",
      });
    }

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};
module.exports = {
  markAttendance,
  getAttendanceByClassAndDate,
  finalizeAttendance,
  getStudentAttendanceReport,
  getTeacherAttendanceWeekStatus,
  getAdminAttendanceDayStatus,
  getClassAttendanceReport,
};
