const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      trim: true,
      default: "",
    },
    size: {
      type: Number,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      trim: true,
      default: "",
    },

    files: {
      type: [fileSchema],
      default: [],
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["submitted", "late", "graded", "returned"],
      default: "submitted",
    },

    score: {
      type: Number,
      min: 0,
      default: null,
    },

    feedback: {
      type: String,
      trim: true,
      default: "",
    },

    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    gradedAt: {
      type: Date,
      default: null,
    },

    resubmissionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

const assignmentSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

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

    type: {
      type: String,
      enum: ["essay", "homework", "project", "classwork"],
      default: "homework",
    },

    dueDate: {
      type: Date,
      required: true,
      index: true,
    },

    maxScore: {
      type: Number,
      default: 10,
      min: 1,
    },

    attachments: {
      type: [fileSchema],
      default: [],
    },

    submissions: {
      type: [submissionSchema],
      default: [],
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    allowLateSubmission: {
      type: Boolean,
      default: false,
    },

    allowResubmission: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  },
);

assignmentSchema.virtual("submissionCount").get(function () {
  return this.submissions.length;
});

assignmentSchema.virtual("pendingCount").get(function () {
  return this.submissions.filter(
    (submission) =>
      submission.status === "submitted" || submission.status === "late",
  ).length;
});

assignmentSchema.index({
  classId: 1,
  createdAt: -1,
});

assignmentSchema.index({
  teacherId: 1,
  createdAt: -1,
});

assignmentSchema.index({
  classId: 1,
  isPublished: 1,
  dueDate: 1,
});

module.exports = mongoose.model("Assignment", assignmentSchema);
