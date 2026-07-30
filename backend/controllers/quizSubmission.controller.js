const quizSubmissionService = require(
  "../services/quizSubmission.service",
);

const sendErrorResponse = (res, error) => {
  return res.status(error.statusCode || 500).json({
    message:
      error.message ||
      "Đã xảy ra lỗi phía máy chủ",
  });
};

// POST /api/v1/quiz-submissions/quizzes/:quizId/start
const startQuiz = async (req, res) => {
  try {
    const result =
      await quizSubmissionService.startQuiz(
        req.params.quizId,
        req.user._id,
      );

    return res.status(
      result.resumed ? 200 : 201,
    ).json({
      message: result.message,
      submission: result.submission,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

// POST /api/v1/quiz-submissions/:submissionId/submit
const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;

    const submission =
      await quizSubmissionService.submitQuiz(
        req.params.submissionId,
        req.user._id,
        answers,
      );

    return res.status(200).json({
      message: "Nộp bài quiz thành công",
      submission,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

// GET /api/v1/quiz-submissions/my-submissions
const getMySubmissions = async (req, res) => {
  try {
    const submissions =
      await quizSubmissionService.getMySubmissions(
        req.user._id,
      );

    return res.status(200).json({
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

// GET /api/v1/quiz-submissions/my-submissions/:submissionId
const getMySubmissionById = async (
  req,
  res,
) => {
  try {
    const submission =
      await quizSubmissionService.getMySubmissionById(
        req.params.submissionId,
        req.user._id,
      );

    return res.status(200).json({
      submission,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

// GET /api/v1/quiz-submissions/quizzes/:quizId
const getQuizSubmissions = async (
  req,
  res,
) => {
  try {
    const submissions =
      await quizSubmissionService.getQuizSubmissions(
        req.params.quizId,
        req.user,
      );

    return res.status(200).json({
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

// GET /api/v1/quiz-submissions/:submissionId
const getStudentSubmission = async (
  req,
  res,
) => {
  try {
    const submission =
      await quizSubmissionService.getStudentSubmission(
        req.params.submissionId,
        req.user,
      );

    return res.status(200).json({
      submission,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

module.exports = {
  startQuiz,
  submitQuiz,
  getMySubmissions,
  getMySubmissionById,
  getQuizSubmissions,
  getStudentSubmission,
};