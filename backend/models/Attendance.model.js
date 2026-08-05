const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["present", "late", "excused", "absent"],
      default: "absent",
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const attendanceSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    records: [attendanceRecordSchema],

    summary: {
      total: {
        type: Number,
        default: 0,
      },

      present: {
        type: Number,
        default: 0,
      },

      absent: {
        type: Number,
        default: 0,
      },

      late: {
        type: Number,
        default: 0,
      },
      excused: {
        type: Number,
        default: 0,
      },
    },

    isFinalized: {
      type: Boolean,
      default: false,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

attendanceSchema.index({ classId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ teacherId: 1, date: 1 });
attendanceSchema.index({ subject: 1, date: 1 });
attendanceSchema.index({ "records.studentId": 1, date: 1 });

attendanceSchema.pre("save", function () {
  if (this.records.length > 0) {
    this.summary = {
      total: this.records.length,
      present: this.records.filter((r) => r.status === "present").length,
      absent: this.records.filter((r) => r.status === "absent").length,
      late: this.records.filter((r) => r.status === "late").length,
      excused: this.records.filter((r) => r.status === "excused").length,
    };
  }
});
  
module.exports = mongoose.model("Attendance", attendanceSchema);
