const quizService = require("../services/quiz.service");

const handleQuizError = (error, res, defaultMessage) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: error.message,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "ID không hợp lệ",
    });
  }

  return res.status(500).json({
    message: defaultMessage,
    error: error.message,
  });
};

// POST /api/v1/quizzes
const createQuiz = async (req, res) => {
  try {
    const quiz = await quizService.createQuiz(req.body, req.user);

    return res.status(201).json({
      message: "Tạo quiz thành công",
      quiz,
    });
  } catch (error) {
    return handleQuizError(error, res, "Lỗi server khi tạo quiz");
  }
};

// GET /api/v1/quizzes
const getQuizzes = async (req, res) => {
  try {
    const quizzes = await quizService.getQuizzes(req.query, req.user);

    return res.status(200).json({
      count: quizzes.length,
      quizzes,
    });
  } catch (error) {
    return handleQuizError(error, res, "Lỗi server khi lấy danh sách quiz");
  }
};

// GET /api/v1/quizzes/:id
const getQuizById = async (req, res) => {
  try {
    const quiz = await quizService.getQuizById(req.params.id, req.user);

    return res.status(200).json({
      quiz,
    });
  } catch (error) {
    return handleQuizError(error, res, "Lỗi server khi lấy thông tin quiz");
  }
};

// PUT /api/v1/quizzes/:id
const updateQuiz = async (req, res) => {
  try {
    const quiz = await quizService.updateQuiz(
      req.params.id,
      req.body,
      req.user,
    );

    return res.status(200).json({
      message: "Cập nhật quiz thành công",
      quiz,
    });
  } catch (error) {
    return handleQuizError(error, res, "Lỗi server khi cập nhật quiz");
  }
};

// DELETE /api/v1/quizzes/:id
const deleteQuiz = async (req, res) => {
  try {
    await quizService.deleteQuiz(req.params.id, req.user);

    return res.status(200).json({
      message: "Xóa quiz thành công",
    });
  } catch (error) {
    return handleQuizError(error, res, "Lỗi server khi xóa quiz");
  }
};

module.exports = {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
};
