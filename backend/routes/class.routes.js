const express = require("express");

const {
  getClasses,
  getClassById,
  getMyClasses,
  getMyClassById,
  createClass,
  updateClass,
  updateClassStatus,
  deleteClass,
} = require("../controllers/class.controller");

const {
  assignTeacherToClass,
} = require("../controllers/classTeacher.controller");

const {
  getAvailableStudents,
  addStudentToClass,
  removeStudentFromClass,
} = require("../controllers/classStudent.controller");

const { requireMongoConnection } = require("../middlewares/mongo.middleware");

const {
  authentication,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();

// ====================
// XEM LỚP HỌC
// Admin và Teacher
// ====================

router.get(
  "/",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin", "teacher"),
  getClasses,
);
// ====================
// LỚP HỌC CỦA HỌC SINH
// Student chỉ xem lớp có chứa mình
// ====================

router.get(
  "/my-classes",
  requireMongoConnection,
  authentication,
  authorizeRoles("student"),
  getMyClasses,
);

router.get(
  "/my-classes/:id",
  requireMongoConnection,
  authentication,
  authorizeRoles("student"),
  getMyClassById,
);
router.get(
  "/:id",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin", "teacher"),
  getClassById,
);

// ====================
// QUẢN LÝ LỚP HỌC
// Chỉ Admin
// ====================

router.post(
  "/",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin"),
  createClass,
);

router.put(
  "/:id",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin"),
  updateClass,
);

router.patch(
  "/:id/status",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin"),
  updateClassStatus,
);

router.delete(
  "/:id",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin"),
  deleteClass,
);

// ====================
// THAY ĐỔI GIÁO VIÊN
// Chỉ Admin
// ====================

router.post(
  "/:id/teachers",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin"),
  assignTeacherToClass,
);

// Không tạo route xóa giáo viên khỏi lớp.
// Admin chỉ được thay thế giáo viên hiện tại bằng giáo viên khác.

// ====================
// QUẢN LÝ HỌC SINH TRONG LỚP
// Admin và Teacher
// ====================

router.get(
  "/:id/available-students",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin", "teacher"),
  getAvailableStudents,
);

router.post(
  "/:id/students",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin", "teacher"),
  addStudentToClass,
);

router.delete(
  "/:id/students/:studentId",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin", "teacher"),
  removeStudentFromClass,
);

module.exports = router;
