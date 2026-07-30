const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
});

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true,
  },

  questionType: {
    type: String,
    enum: ["single_choice"],
    default: "single_choice",
  },

  options: {
    type: [optionSchema],
    required: true,
    validate: {
      validator: function (options) {
        return Array.isArray(options) && options.length >= 2;
      },
      message: "Mỗi câu hỏi phải có ít nhất 2 đáp án",
    },
  },

  correctOptionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  score: {
    type: Number,
    required: true,
    min: 0,
    default: 1,
  },

  explanation: {
    type: String,
    trim: true,
    default: "",
  },
});

const sourceFileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },

    url: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,
      enum: ["", "txt", "docx"],
      default: "",
    },
  },
  {
    _id: false,
  },
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    creationType: {
      type: String,
      enum: ["manual", "document"],
      default: "manual",
    },

    sourceFile: {
      type: sourceFileSchema,
      default: () => ({
        name: "",
        url: "",
        type: "",
      }),
    },

    questions: {
      type: [questionSchema],
      default: [],
      validate: {
        validator: function (questions) {
          return Array.isArray(questions) && questions.length > 0;
        },
        message: "Quiz phải có ít nhất một câu hỏi",
      },
    },

    totalScore: {
      type: Number,
      min: 0,
      default: 0,
    },

    startDate: {
      type: Date,
      default: null,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    duration: {
      type: Number,
      min: 1,
      default: null,
    },

    allowLateSubmission: {
      type: Boolean,
      default: false,
    },

    attemptsAllowed: {
      type: Number,
      min: 1,
      default: 1,
    },

    showResultImmediately: {
      type: Boolean,
      default: true,
    },

    showCorrectAnswers: {
      type: Boolean,
      default: true,
    },

    showExplanations: {
      type: Boolean,
      default: true,
    },

    shuffleQuestions: {
      type: Boolean,
      default: false,
    },

    shuffleOptions: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

quizSchema.index({
  classId: 1,
  status: 1,
  createdAt: -1,
});

quizSchema.index({
  teacherId: 1,
  createdAt: -1,
});

quizSchema.pre("validate", function (next) {
  if (this.startDate && this.dueDate && this.dueDate <= this.startDate) {
    this.invalidate("dueDate", "Hạn nộp phải lớn hơn thời gian bắt đầu");
  }

  if (this.creationType === "document") {
    if (!this.sourceFile?.name || !this.sourceFile?.url) {
      this.invalidate(
        "sourceFile",
        "Quiz tạo từ tài liệu phải có thông tin file nguồn",
      );
    }

    if (!["txt", "docx"].includes(this.sourceFile?.type)) {
      this.invalidate(
        "sourceFile.type",
        "File quiz chỉ hỗ trợ định dạng txt hoặc docx",
      );
    }
  }

  this.questions.forEach((question, questionIndex) => {
    const correctOptionExists = question.options.some(
      (option) => option._id.toString() === question.correctOptionId.toString(),
    );

    if (!correctOptionExists) {
      this.invalidate(
        `questions.${questionIndex}.correctOptionId`,
        "Đáp án đúng không tồn tại trong danh sách đáp án",
      );
    }
  });

  next();
});

quizSchema.pre("save", function (next) {
  this.totalScore = this.questions.reduce(
    (total, question) => total + question.score,
    0,
  );

  next();
});

module.exports = mongoose.model("Quiz", quizSchema);
