const express = require("express");

const {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
} = require("../controllers/quiz.controller");

const {
  authentication,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();

// Admin, Teacher và Student đều có thể xem danh sách
router.get(
  "/",
  authentication,
  authorizeRoles("admin", "teacher", "student"),
  getQuizzes,
);

// Admin, Teacher và Student đều có thể xem chi tiết
// Service sẽ kiểm tra quyền cụ thể
router.get(
  "/:id",
  authentication,
  authorizeRoles("admin", "teacher", "student"),
  getQuizById,
);

// Chỉ Admin và Teacher được tạo quiz
router.post(
  "/",
  authentication,
  authorizeRoles("admin", "teacher"),
  createQuiz,
);

// Chỉ Admin và Teacher được cập nhật quiz
router.put(
  "/:id",
  authentication,
  authorizeRoles("admin", "teacher"),
  updateQuiz,
);

// Chỉ Admin và Teacher được xóa quiz
router.delete(
  "/:id",
  authentication,
  authorizeRoles("admin", "teacher"),
  deleteQuiz,
);

module.exports = router;
