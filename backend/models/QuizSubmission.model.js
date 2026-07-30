const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    selectedOptionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    isCorrect: {
      type: Boolean,
      default: false,
    },

    awardedScore: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
  },
);

const quizSubmissionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    attemptNumber: {
      type: Number,
      min: 1,
      default: 1,
      required: true,
    },

    answers: {
      type: [answerSchema],
      default: [],
    },

    score: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalScore: {
      type: Number,
      min: 0,
      required: true,
    },

    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["in_progress", "submitted"],
      default: "in_progress",
      index: true,
    },

    isLate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

quizSubmissionSchema.index(
  {
    quizId: 1,
    studentId: 1,
    attemptNumber: 1,
  },
  {
    unique: true,
  },
);

quizSubmissionSchema.index({
  quizId: 1,
  submittedAt: -1,
});

quizSubmissionSchema.index({
  studentId: 1,
  createdAt: -1,
});

module.exports = mongoose.model("QuizSubmission", quizSubmissionSchema);
