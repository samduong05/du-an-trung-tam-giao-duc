const mongoose = require("mongoose");
const Quiz = require("../models/Quiz.model");
const Class = require("../models/Class.model");

const createServiceError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
};

const checkObjectId = (id, message = "ID không hợp lệ") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createServiceError(message, 400);
  }
};

const normalizeOptions = (options = []) => {
  if (!Array.isArray(options) || options.length < 2) {
    throw createServiceError("Mỗi câu hỏi phải có ít nhất 2 đáp án", 400);
  }

  return options.map((option) => {
    const text =
      typeof option === "string" ? option.trim() : option?.text?.trim();

    if (!text) {
      throw createServiceError("Nội dung đáp án không được để trống", 400);
    }

    return {
      _id:
        option?._id && mongoose.Types.ObjectId.isValid(option._id)
          ? option._id
          : new mongoose.Types.ObjectId(),

      text,
    };
  });
};

const normalizeQuestions = (questions = []) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw createServiceError("Quiz phải có ít nhất một câu hỏi", 400);
  }

  return questions.map((question, questionIndex) => {
    const questionText = question.questionText?.trim();

    if (!questionText) {
      throw createServiceError(
        `Câu hỏi thứ ${questionIndex + 1} chưa có nội dung`,
        400,
      );
    }

    const options = normalizeOptions(question.options);

    let correctOptionId;

    /*
     * Khi tạo câu hỏi thủ công hoặc từ parser:
     * frontend/service parser gửi correctOptionIndex.
     */
    if (question.correctOptionIndex !== undefined) {
      const correctOptionIndex = Number(question.correctOptionIndex);

      if (
        !Number.isInteger(correctOptionIndex) ||
        correctOptionIndex < 0 ||
        correctOptionIndex >= options.length
      ) {
        throw createServiceError(
          `Đáp án đúng của câu hỏi thứ ${questionIndex + 1} không hợp lệ`,
          400,
        );
      }

      correctOptionId = options[correctOptionIndex]._id;
    } else if (question.correctOptionId) {
      /*
       * Khi cập nhật câu hỏi đã có:
       * frontend có thể gửi lại correctOptionId.
       */
      const correctOptionExists = options.some(
        (option) =>
          option._id.toString() === question.correctOptionId.toString(),
      );

      if (!correctOptionExists) {
        throw createServiceError(
          `Đáp án đúng của câu hỏi thứ ${questionIndex + 1} không tồn tại`,
          400,
        );
      }

      correctOptionId = question.correctOptionId;
    } else {
      throw createServiceError(
        `Vui lòng chọn đáp án đúng cho câu hỏi thứ ${questionIndex + 1}`,
        400,
      );
    }

    const score = question.score === undefined ? 1 : Number(question.score);

    if (Number.isNaN(score) || score < 0) {
      throw createServiceError(
        `Điểm của câu hỏi thứ ${questionIndex + 1} không hợp lệ`,
        400,
      );
    }

    return {
      _id:
        question._id && mongoose.Types.ObjectId.isValid(question._id)
          ? question._id
          : new mongoose.Types.ObjectId(),

      questionText,

      questionType: question.questionType || "single_choice",

      options,

      correctOptionId,

      score,

      explanation: question.explanation?.trim() || "",
    };
  });
};

const getClassAndCheckTeacher = async (classId, user) => {
  checkObjectId(classId, "classId không hợp lệ");

  const classData = await Class.findById(classId);

  if (!classData) {
    throw createServiceError("Không tìm thấy lớp học", 404);
  }

  if (
    user.role === "teacher" &&
    classData.teacher.toString() !== user._id.toString()
  ) {
    throw createServiceError(
      "Teacher chỉ được quản lý quiz của lớp mình phụ trách",
      403,
    );
  }

  return classData;
};

const hideAnswersFromStudent = (quiz) => {
  const quizData = quiz.toObject
    ? quiz.toObject()
    : JSON.parse(JSON.stringify(quiz));

  quizData.questions = quizData.questions.map((question) => ({
    _id: question._id,
    questionText: question.questionText,
    questionType: question.questionType,
    options: question.options,
    score: question.score,
  }));

  delete quizData.sourceFile;

  return quizData;
};

const createQuiz = async (quizData, user) => {
  const {
    title,
    description,
    classId,
    creationType = "manual",
    sourceFile,
    questions,
    startDate,
    dueDate,
    duration,
    allowLateSubmission,
    attemptsAllowed,
    showResultImmediately,
    showCorrectAnswers,
    showExplanations,
    shuffleQuestions,
    shuffleOptions,
    status = "draft",
  } = quizData;

  if (!title?.trim()) {
    throw createServiceError("Vui lòng nhập tiêu đề quiz", 400);
  }

  if (!description?.trim()) {
    throw createServiceError("Vui lòng nhập mô tả quiz", 400);
  }

  if (!classId) {
    throw createServiceError("Vui lòng chọn lớp học", 400);
  }

  if (!dueDate) {
    throw createServiceError("Vui lòng nhập hạn làm quiz", 400);
  }

  const classData = await getClassAndCheckTeacher(classId, user);

  const normalizedQuestions = normalizeQuestions(questions);

  const quiz = await Quiz.create({
    title: title.trim(),
    description: description.trim(),

    classId,

    // Quiz thuộc giáo viên đang phụ trách lớp
    teacherId: classData.teacher,

    creationType,
    sourceFile,

    questions: normalizedQuestions,

    startDate: startDate || null,
    dueDate,

    duration:
      duration === undefined || duration === null || duration === ""
        ? null
        : Number(duration),

    allowLateSubmission,
    attemptsAllowed,
    showResultImmediately,
    showCorrectAnswers,
    showExplanations,
    shuffleQuestions,
    shuffleOptions,

    status,
  });

  return quiz;
};

const getQuizzes = async (query, user) => {
  const { classId, status, search } = query;

  const filter = {};

  if (classId) {
    checkObjectId(classId, "classId không hợp lệ");
    filter.classId = classId;
  }

  if (status) {
    const allowedStatuses = ["draft", "published", "closed"];

    if (!allowedStatuses.includes(status)) {
      throw createServiceError("Trạng thái quiz không hợp lệ", 400);
    }

    filter.status = status;
  }

  if (search?.trim()) {
    filter.$or = [
      {
        title: {
          $regex: search.trim(),
          $options: "i",
        },
      },
      {
        description: {
          $regex: search.trim(),
          $options: "i",
        },
      },
    ];
  }

  if (user.role === "teacher") {
    filter.teacherId = user._id;
  }

  if (user.role === "student") {
    const classes = await Class.find({
      students: user._id,
    }).select("_id");

    filter.classId = {
      $in: classes.map((classData) => classData._id),
    };

    filter.status = "published";
  }

  const quizzes = await Quiz.find(filter)
    .populate("classId", "name description")
    .populate("teacherId", "name email")
    .sort({ createdAt: -1 });

  if (user.role === "student") {
    /*
     * Danh sách Quiz của student không cần trả toàn bộ câu hỏi,
     * tránh tải dữ liệu thừa và tránh lộ đáp án.
     */
    return quizzes.map((quiz) => {
      const quizData = quiz.toObject();

      delete quizData.questions;
      delete quizData.sourceFile;

      return quizData;
    });
  }

  return quizzes;
};

const getQuizById = async (quizId, user) => {
  checkObjectId(quizId, "Quiz ID không hợp lệ");

  const quiz = await Quiz.findById(quizId)
    .populate("classId", "name description teacher students")
    .populate("teacherId", "name email");

  if (!quiz) {
    throw createServiceError("Không tìm thấy quiz", 404);
  }

  if (
    user.role === "teacher" &&
    quiz.teacherId._id.toString() !== user._id.toString()
  ) {
    throw createServiceError("Teacher không có quyền xem quiz này", 403);
  }

  if (user.role === "student") {
    const studentIds = quiz.classId.students.map((studentId) =>
      studentId.toString(),
    );

    if (!studentIds.includes(user._id.toString())) {
      throw createServiceError("Bạn không thuộc lớp học của quiz này", 403);
    }

    if (quiz.status !== "published") {
      throw createServiceError("Quiz chưa được công bố", 403);
    }

    return hideAnswersFromStudent(quiz);
  }

  return quiz;
};

const updateQuiz = async (quizId, updateData, user) => {
  checkObjectId(quizId, "Quiz ID không hợp lệ");

  const quiz = await Quiz.findById(quizId);

  if (!quiz) {
    throw createServiceError("Không tìm thấy quiz", 404);
  }

  if (
    user.role === "teacher" &&
    quiz.teacherId.toString() !== user._id.toString()
  ) {
    throw createServiceError("Teacher chỉ được cập nhật quiz của mình", 403);
  }

  /*
   * Nếu đổi lớp, phải kiểm tra lớp mới và cập nhật teacherId
   * theo giáo viên đang phụ trách lớp mới.
   */
  if (
    updateData.classId &&
    updateData.classId.toString() !== quiz.classId.toString()
  ) {
    const classData = await getClassAndCheckTeacher(updateData.classId, user);

    quiz.classId = classData._id;
    quiz.teacherId = classData.teacher;
  }

  const allowedFields = [
    "title",
    "description",
    "creationType",
    "sourceFile",
    "startDate",
    "dueDate",
    "duration",
    "allowLateSubmission",
    "attemptsAllowed",
    "showResultImmediately",
    "showCorrectAnswers",
    "showExplanations",
    "shuffleQuestions",
    "shuffleOptions",
    "status",
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      quiz[field] = updateData[field];
    }
  });

  if (updateData.questions !== undefined) {
    quiz.questions = normalizeQuestions(updateData.questions);
  }

  await quiz.save();

  return quiz;
};

const deleteQuiz = async (quizId, user) => {
  checkObjectId(quizId, "Quiz ID không hợp lệ");

  const quiz = await Quiz.findById(quizId);

  if (!quiz) {
    throw createServiceError("Không tìm thấy quiz", 404);
  }

  if (
    user.role === "teacher" &&
    quiz.teacherId.toString() !== user._id.toString()
  ) {
    throw createServiceError("Teacher chỉ được xóa quiz của mình", 403);
  }

  await quiz.deleteOne();

  return quiz;
};

module.exports = {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
};
