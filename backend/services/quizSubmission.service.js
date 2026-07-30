const Quiz = require("../models/Quiz.model");
const QuizSubmission = require("../models/QuizSubmission.model");
const Class = require("../models/Class.model");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const compareObjectId = (firstId, secondId) => {
  if (!firstId || !secondId) {
    return false;
  }

  return firstId.toString() === secondId.toString();
};

const calculateQuizTotalScore = (quiz) => {
  if (typeof quiz.totalScore === "number" && quiz.totalScore >= 0) {
    return quiz.totalScore;
  }

  return quiz.questions.reduce((total, question) => {
    return total + (question.score || 0);
  }, 0);
};

const checkStudentBelongsToClass = async (classId, studentId) => {
  const classData = await Class.findById(classId);

  if (!classData) {
    throw createError(404, "Không tìm thấy lớp học");
  }

  const belongsToClass = classData.students.some((item) =>
    compareObjectId(item, studentId),
  );

  if (!belongsToClass) {
    throw createError(403, "Bạn không thuộc lớp học của bài quiz này");
  }

  return classData;
};

const checkTeacherCanAccessQuiz = async (quiz, user) => {
  if (user.role === "admin") {
    return;
  }

  const classData = await Class.findById(quiz.classId);

  if (!classData) {
    throw createError(404, "Không tìm thấy lớp học");
  }

  if (!compareObjectId(classData.teacher, user._id)) {
    throw createError(403, "Bạn không có quyền xem bài nộp của quiz này");
  }
};

const buildStudentSubmissionResult = (submission, quiz) => {
  const result = {
    _id: submission._id,
    quizId: submission.quizId,
    classId: submission.classId,
    studentId: submission.studentId,
    attemptNumber: submission.attemptNumber,
    startedAt: submission.startedAt,
    submittedAt: submission.submittedAt,
    status: submission.status,
    isLate: submission.isLate,
  };

  if (submission.status !== "submitted" || !quiz.showResultImmediately) {
    return {
      ...result,
      message:
        submission.status === "submitted"
          ? "Bài làm đã được nộp. Kết quả chưa được công bố."
          : "Bài quiz đang được thực hiện.",
    };
  }

  result.score = submission.score;
  result.totalScore = submission.totalScore;

  result.answers = submission.answers.map((submissionAnswer) => {
    const question = quiz.questions.find((item) =>
      compareObjectId(item._id, submissionAnswer.questionId),
    );

    const answerResult = {
      questionId: submissionAnswer.questionId,
      selectedOptionId: submissionAnswer.selectedOptionId,
      isCorrect: submissionAnswer.isCorrect,
      awardedScore: submissionAnswer.awardedScore,
      maxScore: question?.score || 0,
    };

    if (quiz.showCorrectAnswers && question) {
      answerResult.questionText = question.questionText;
      answerResult.options = question.options;
      answerResult.correctOptionId = question.correctOptionId;
    }

    if (quiz.showExplanations && question?.explanation) {
      answerResult.explanation = question.explanation;
    }

    return answerResult;
  });

  return result;
};

const startQuiz = async (quizId, studentId) => {
  const quiz = await Quiz.findById(quizId);

  if (!quiz) {
    throw createError(404, "Không tìm thấy quiz");
  }

  if (quiz.status !== "published") {
    throw createError(400, "Quiz chưa được xuất bản");
  }

  await checkStudentBelongsToClass(quiz.classId, studentId);

  const now = new Date();

  if (quiz.startDate && now < new Date(quiz.startDate)) {
    throw createError(400, "Quiz chưa đến thời gian bắt đầu");
  }

  if (
    quiz.dueDate &&
    now > new Date(quiz.dueDate) &&
    !quiz.allowLateSubmission
  ) {
    throw createError(400, "Quiz đã hết hạn làm bài");
  }

  const existingSubmission = await QuizSubmission.findOne({
    quizId: quiz._id,
    studentId,
    status: "in_progress",
  });

  if (existingSubmission) {
    return {
      submission: existingSubmission,
      resumed: true,
      message: "Bạn đang có một lượt làm chưa hoàn thành",
    };
  }

  const latestSubmission = await QuizSubmission.findOne({
    quizId: quiz._id,
    studentId,
  }).sort({
    attemptNumber: -1,
  });

  const nextAttemptNumber = latestSubmission
    ? latestSubmission.attemptNumber + 1
    : 1;

  const attemptsAllowed = quiz.attemptsAllowed || 1;

  if (nextAttemptNumber > attemptsAllowed) {
    throw createError(400, "Bạn đã sử dụng hết số lần được phép làm quiz");
  }

  const totalScore = calculateQuizTotalScore(quiz);

  const submission = await QuizSubmission.create({
    quizId: quiz._id,
    classId: quiz.classId,
    studentId,
    attemptNumber: nextAttemptNumber,
    answers: [],
    score: 0,
    totalScore,
    startedAt: now,
    submittedAt: null,
    status: "in_progress",
    isLate: false,
  });

  return {
    submission,
    resumed: false,
    message: "Bắt đầu làm quiz thành công",
  };
};

const submitQuiz = async (submissionId, studentId, submittedAnswers) => {
  if (!Array.isArray(submittedAnswers)) {
    throw createError(400, "answers phải là một mảng");
  }

  const submission = await QuizSubmission.findOne({
    _id: submissionId,
    studentId,
  });

  if (!submission) {
    throw createError(404, "Không tìm thấy bài làm");
  }

  if (submission.status === "submitted") {
    throw createError(400, "Bài làm này đã được nộp");
  }

  const quiz = await Quiz.findById(submission.quizId);

  if (!quiz) {
    throw createError(404, "Không tìm thấy quiz");
  }

  const now = new Date();

  if (quiz.duration && quiz.duration > 0) {
    const expiredAt = new Date(
      submission.startedAt.getTime() + quiz.duration * 60 * 1000,
    );

    if (now > expiredAt) {
      throw createError(400, "Bạn đã vượt quá thời gian làm bài");
    }
  }

  const isLate = Boolean(quiz.dueDate) && now > new Date(quiz.dueDate);

  if (isLate && !quiz.allowLateSubmission) {
    throw createError(400, "Quiz đã hết hạn và không cho phép nộp muộn");
  }

  const submittedQuestionIds = new Set();

  for (const answer of submittedAnswers) {
    if (!answer.questionId) {
      throw createError(400, "Mỗi câu trả lời phải có questionId");
    }

    const questionId = answer.questionId.toString();

    if (submittedQuestionIds.has(questionId)) {
      throw createError(
        400,
        "Không được gửi nhiều đáp án cho cùng một câu hỏi",
      );
    }

    submittedQuestionIds.add(questionId);
  }

  let score = 0;

  const gradedAnswers = quiz.questions.map((question) => {
    const submittedAnswer = submittedAnswers.find((answer) =>
      compareObjectId(answer.questionId, question._id),
    );

    const selectedOptionId = submittedAnswer?.selectedOptionId || null;

    if (selectedOptionId) {
      const selectedOptionExists = question.options.some((option) =>
        compareObjectId(option._id, selectedOptionId),
      );

      if (!selectedOptionExists) {
        throw createError(
          400,
          "Đáp án được chọn không thuộc câu hỏi tương ứng",
        );
      }
    }

    const isCorrect = selectedOptionId
      ? compareObjectId(selectedOptionId, question.correctOptionId)
      : false;

    const awardedScore = isCorrect ? question.score || 0 : 0;

    score += awardedScore;

    return {
      questionId: question._id,
      selectedOptionId,
      isCorrect,
      awardedScore,
    };
  });

  for (const submittedAnswer of submittedAnswers) {
    const questionExists = quiz.questions.some((question) =>
      compareObjectId(question._id, submittedAnswer.questionId),
    );

    if (!questionExists) {
      throw createError(400, "Có questionId không thuộc quiz này");
    }
  }

  submission.answers = gradedAnswers;
  submission.score = score;
  submission.totalScore = calculateQuizTotalScore(quiz);
  submission.submittedAt = now;
  submission.status = "submitted";
  submission.isLate = isLate;

  await submission.save();

  return buildStudentSubmissionResult(submission, quiz);
};

const getMySubmissions = async (studentId) => {
  const submissions = await QuizSubmission.find({
    studentId,
  })
    .populate({
      path: "quizId",
      select: "title status showResultImmediately",
    })
    .populate({
      path: "classId",
      select: "name",
    })
    .sort({
      createdAt: -1,
    });

  return submissions.map((submission) => {
    const result = {
      _id: submission._id,
      quizId: submission.quizId,
      classId: submission.classId,
      attemptNumber: submission.attemptNumber,
      status: submission.status,
      startedAt: submission.startedAt,
      submittedAt: submission.submittedAt,
      isLate: submission.isLate,
    };

    if (
      submission.status === "submitted" &&
      submission.quizId?.showResultImmediately
    ) {
      result.score = submission.score;
      result.totalScore = submission.totalScore;
    }

    return result;
  });
};

const getMySubmissionById = async (submissionId, studentId) => {
  const submission = await QuizSubmission.findOne({
    _id: submissionId,
    studentId,
  });

  if (!submission) {
    throw createError(404, "Không tìm thấy bài làm");
  }

  const quiz = await Quiz.findById(submission.quizId);

  if (!quiz) {
    throw createError(404, "Không tìm thấy quiz");
  }

  return buildStudentSubmissionResult(submission, quiz);
};

const getQuizSubmissions = async (quizId, user) => {
  const quiz = await Quiz.findById(quizId);

  if (!quiz) {
    throw createError(404, "Không tìm thấy quiz");
  }

  await checkTeacherCanAccessQuiz(quiz, user);

  const submissions = await QuizSubmission.find({
    quizId,
  })
    .populate({
      path: "studentId",
      select: "name email",
    })
    .sort({
      submittedAt: -1,
      createdAt: -1,
    });

  return submissions;
};

const getStudentSubmission = async (submissionId, user) => {
  const submission = await QuizSubmission.findById(submissionId).populate({
    path: "studentId",
    select: "name email",
  });

  if (!submission) {
    throw createError(404, "Không tìm thấy bài làm");
  }

  const quiz = await Quiz.findById(submission.quizId);

  if (!quiz) {
    throw createError(404, "Không tìm thấy quiz");
  }

  await checkTeacherCanAccessQuiz(quiz, user);

  const detailedAnswers = submission.answers.map((answer) => {
    const question = quiz.questions.find((item) =>
      compareObjectId(item._id, answer.questionId),
    );

    return {
      questionId: answer.questionId,
      questionText: question?.questionText || "",
      options: question?.options || [],
      selectedOptionId: answer.selectedOptionId,
      correctOptionId: question?.correctOptionId || null,
      isCorrect: answer.isCorrect,
      awardedScore: answer.awardedScore,
      maxScore: question?.score || 0,
      explanation: question?.explanation || "",
    };
  });

  return {
    _id: submission._id,
    quizId: submission.quizId,
    classId: submission.classId,
    studentId: submission.studentId,
    attemptNumber: submission.attemptNumber,
    answers: detailedAnswers,
    score: submission.score,
    totalScore: submission.totalScore,
    startedAt: submission.startedAt,
    submittedAt: submission.submittedAt,
    status: submission.status,
    isLate: submission.isLate,
  };
};

module.exports = {
  startQuiz,
  submitQuiz,
  getMySubmissions,
  getMySubmissionById,
  getQuizSubmissions,
  getStudentSubmission,
};
