const express = require("express");

const {
  startQuiz,
  submitQuiz,
  getMySubmissions,
  getMySubmissionById,
  getQuizSubmissions,
  getStudentSubmission,
} = require(
  "../controllers/quizSubmission.controller",
);

const {
  authentication,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authentication);

// Student bắt đầu làm quiz
router.post(
  "/quizzes/:quizId/start",
  authorizeRoles("student"),
  startQuiz,
);

// Student nộp quiz
router.post(
  "/:submissionId/submit",
  authorizeRoles("student"),
  submitQuiz,
);

// Student xem danh sách bài làm của mình
router.get(
  "/my-submissions",
  authorizeRoles("student"),
  getMySubmissions,
);

// Student xem chi tiết một bài làm của mình
router.get(
  "/my-submissions/:submissionId",
  authorizeRoles("student"),
  getMySubmissionById,
);

// Teacher hoặc Admin xem danh sách bài nộp của quiz
router.get(
  "/quizzes/:quizId",
  authorizeRoles("admin", "teacher"),
  getQuizSubmissions,
);

// Teacher hoặc Admin xem chi tiết một bài làm
router.get(
  "/:submissionId",
  authorizeRoles("admin", "teacher"),
  getStudentSubmission,
);

module.exports = router;