const express = require("express");

const {
  markAttendance,
  getAttendanceByClassAndDate,
  finalizeAttendance,
  getStudentAttendanceReport,
  getTeacherAttendanceWeekStatus,
  getAdminAttendanceDayStatus,
  getClassAttendanceReport
} = require("../controllers/attendance.controller");

const { requireMongoConnection } = require("../middlewares/mongo.middleware");
const {
  authentication,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();

// Điểm danh một lớp theo ngày
// POST /api/v1/attendance/classes/:classId/mark
router.post(
  "/classes/:classId/mark",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin", "teacher"),
  markAttendance,
);


// Lấy điểm danh của một lớp theo ngày
// GET /api/v1/attendance/classes/:classId/by-date?date=2026-07-08
router.get(
  "/classes/:classId/by-date",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin", "teacher"),
  getAttendanceByClassAndDate,
);


// Xem báo cáo chuyên cần của một lớp
// GET /api/v1/attendance/classes/:classId/report?from=2026-07-01&to=2026-07-31
router.get(
  "/classes/:classId/report",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin", "teacher"),
  getClassAttendanceReport,
);
// Lấy trạng thái điểm danh của các lớp theo một ngày
// GET /api/v1/attendance/admin/day-status?date=2026-08-03
router.get(
  "/admin/day-status",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin"),
  getAdminAttendanceDayStatus,
);
// Lấy trạng thái điểm danh của giáo viên theo tuần
// GET /api/v1/attendance/teacher/week-status?from=2026-08-03&to=2026-08-09
router.get(
  "/teacher/week-status",
  requireMongoConnection,
  authentication,
  authorizeRoles("teacher"),
  getTeacherAttendanceWeekStatus,
);

// Chốt điểm danh
// PATCH /api/v1/attendance/:attendanceId/finalize
router.patch(
  "/:attendanceId/finalize",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin", "teacher"),
  finalizeAttendance,
);

// Xem báo cáo điểm danh của một học sinh
// GET /api/v1/attendance/students/:studentId/report?from=2026-07-01&to=2026-07-31
router.get(
  "/students/:studentId/report",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin", "teacher", "student"),
  getStudentAttendanceReport,
);

module.exports = router;
