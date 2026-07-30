const express = require("express");

const Assignment = require("../models/Assignment.model");
const Class = require("../models/Class.model");

const {
  authentication,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authentication);

// ==================================================
// GET /api/v1/assignments
// Lấy danh sách bài tập
// ==================================================

router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.classId) {
      filter.classId = req.query.classId;
    }

    // Giáo viên chỉ xem bài tập của mình
    if (req.user.role === "teacher") {
      filter.teacherId = req.user._id;
    }

    // Học sinh chỉ xem bài tập đã xuất bản
    // thuộc những lớp mình đang học
    if (req.user.role === "student") {
      const classes = await Class.find({
        students: req.user._id,
      }).select("_id");

      const studentClassIds = classes.map((item) => item._id);

      // Nếu frontend truyền classId thì phải kiểm tra
      // class đó có thuộc danh sách lớp của học sinh không
      if (req.query.classId) {
        const isInClass = studentClassIds.some(
          (classId) => classId.toString() === req.query.classId,
        );

        if (!isInClass) {
          return res.status(403).json({
            message: "Bạn không thuộc lớp học này",
          });
        }

        filter.classId = req.query.classId;
      } else {
        filter.classId = {
          $in: studentClassIds,
        };
      }

      filter.isPublished = true;
    }

    const assignments = await Assignment.find(filter)
      .populate("classId", "name")
      .populate("teacherId", "name email")
      .sort({ createdAt: -1 });

    let result = assignments;

    // Học sinh chỉ được thấy bài nộp của chính mình
    if (req.user.role === "student") {
      result = assignments.map((assignment) => {
        const data = assignment.toObject();

        const mySubmission = assignment.submissions.find(
          (submission) =>
            submission.studentId.toString() === req.user._id.toString(),
        );

        delete data.submissions;

        return {
          ...data,
          hasSubmitted: Boolean(mySubmission),
          mySubmission: mySubmission || null,
        };
      });
    }

    return res.json({
      assignments: result,
    });
  } catch (error) {
    console.log("Lỗi lấy danh sách bài tập:", error);

    return res.status(500).json({
      message: "Lấy danh sách bài tập thất bại",
    });
  }
});

// ==================================================
// GET /api/v1/assignments/:id
// Lấy chi tiết một bài tập
// ==================================================

router.get("/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("classId", "name teacher students")
      .populate("teacherId", "name email")
      .populate("submissions.studentId", "name email")
      .populate("submissions.gradedBy", "name email");

    if (!assignment) {
      return res.status(404).json({
        message: "Không tìm thấy bài tập",
      });
    }

    const classData = assignment.classId;

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học của bài tập",
      });
    }

    // Giáo viên chỉ xem bài thuộc lớp mình phụ trách
    if (
      req.user.role === "teacher" &&
      classData.teacher.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền xem bài tập này",
      });
    }

    // Học sinh chỉ xem bài đã xuất bản thuộc lớp mình học
    if (req.user.role === "student") {
      const isStudentInClass = classData.students.some(
        (studentId) => studentId.toString() === req.user._id.toString(),
      );

      if (!isStudentInClass || !assignment.isPublished) {
        return res.status(403).json({
          message: "Bạn không có quyền xem bài tập này",
        });
      }

      const data = assignment.toObject();

      const mySubmission = data.submissions.find((submission) => {
        const studentId = submission.studentId?._id || submission.studentId;

        return studentId.toString() === req.user._id.toString();
      });

      delete data.submissions;

      return res.json({
        assignment: {
          ...data,
          hasSubmitted: Boolean(mySubmission),
          mySubmission: mySubmission || null,
        },
      });
    }

    return res.json({
      assignment,
    });
  } catch (error) {
    console.log("Lỗi lấy bài tập:", error);

    return res.status(500).json({
      message: "Lấy bài tập thất bại",
    });
  }
});

// ==================================================
// POST /api/v1/assignments
// Admin và Teacher tạo bài tập
// ==================================================

router.post("/", authorizeRoles("admin", "teacher"), async (req, res) => {
  try {
    const {
      classId,
      title,
      description,
      type,
      dueDate,
      maxScore,
      attachments,
      isPublished,
      allowLateSubmission,
      allowResubmission,
    } = req.body;

    if (!classId || !title || !description || !dueDate) {
      return res.status(400).json({
        message: "Vui lòng nhập classId, title, description và dueDate",
      });
    }

    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học",
      });
    }

    if (!classData.teacher) {
      return res.status(400).json({
        message: "Lớp học chưa có giáo viên phụ trách",
      });
    }

    if (
      req.user.role === "teacher" &&
      classData.teacher.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Bạn chỉ được tạo bài cho lớp mình phụ trách",
      });
    }

    const assignment = await Assignment.create({
      classId,
      teacherId: classData.teacher,
      title,
      description,
      type,
      dueDate,
      maxScore,
      attachments,
      isPublished,
      allowLateSubmission,
      allowResubmission,
    });

    return res.status(201).json({
      message: "Tạo bài tập thành công",
      assignment,
    });
  } catch (error) {
    console.log("Lỗi tạo bài tập:", error);

    return res.status(500).json({
      message: "Tạo bài tập thất bại",
    });
  }
});

// ==================================================
// PUT /api/v1/assignments/:id
// Admin và Teacher cập nhật bài tập
// ==================================================

router.put("/:id", authorizeRoles("admin", "teacher"), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        message: "Không tìm thấy bài tập",
      });
    }

    if (
      req.user.role === "teacher" &&
      assignment.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền sửa bài tập này",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "type",
      "dueDate",
      "maxScore",
      "attachments",
      "isPublished",
      "allowLateSubmission",
      "allowResubmission",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        assignment[field] = req.body[field];
      }
    });

    await assignment.save();

    return res.json({
      message: "Cập nhật bài tập thành công",
      assignment,
    });
  } catch (error) {
    console.log("Lỗi cập nhật bài tập:", error);

    return res.status(500).json({
      message: "Cập nhật bài tập thất bại",
    });
  }
});

// ==================================================
// DELETE /api/v1/assignments/:id
// Admin và Teacher xóa bài tập
// ==================================================

router.delete("/:id", authorizeRoles("admin", "teacher"), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        message: "Không tìm thấy bài tập",
      });
    }

    if (
      req.user.role === "teacher" &&
      assignment.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền xóa bài tập này",
      });
    }

    await assignment.deleteOne();

    return res.json({
      message: "Xóa bài tập thành công",
    });
  } catch (error) {
    console.log("Lỗi xóa bài tập:", error);

    return res.status(500).json({
      message: "Xóa bài tập thất bại",
    });
  }
});

// ==================================================
// POST /api/v1/assignments/:id/submit
// Học sinh nộp bài hoặc nộp lại
// ==================================================

router.post("/:id/submit", authorizeRoles("student"), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        message: "Không tìm thấy bài tập",
      });
    }

    // Không cho học sinh nộp bài chưa xuất bản
    if (!assignment.isPublished) {
      return res.status(403).json({
        message: "Bài tập chưa được xuất bản",
      });
    }

    const classData = await Class.findById(assignment.classId);

    if (!classData) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học của bài tập",
      });
    }

    const isStudentInClass = classData.students.some(
      (studentId) => studentId.toString() === req.user._id.toString(),
    );

    if (!isStudentInClass) {
      return res.status(403).json({
        message: "Bạn không thuộc lớp học này",
      });
    }

    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

    const files = Array.isArray(req.body.files) ? req.body.files : [];

    if (!text && files.length === 0) {
      return res.status(400).json({
        message: "Bài nộp phải có nội dung hoặc tệp đính kèm",
      });
    }

    const existing = assignment.submissions.find(
      (submission) =>
        submission.studentId.toString() === req.user._id.toString(),
    );

    if (existing && !assignment.allowResubmission) {
      return res.status(409).json({
        message: "Bạn đã nộp bài và bài tập không cho phép nộp lại",
      });
    }

    const isLate = new Date() > assignment.dueDate;

    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({
        message: "Bài tập đã quá hạn",
      });
    }

    if (existing) {
      existing.text = text;
      existing.files = files;
      existing.status = isLate ? "late" : "submitted";
      existing.submittedAt = new Date();

      existing.score = null;
      existing.feedback = "";
      existing.gradedBy = null;
      existing.gradedAt = null;

      existing.resubmissionCount += 1;
    } else {
      assignment.submissions.push({
        studentId: req.user._id,
        text,
        files,
        status: isLate ? "late" : "submitted",
        submittedAt: new Date(),
      });
    }

    await assignment.save();

    const savedSubmission = assignment.submissions.find(
      (submission) =>
        submission.studentId.toString() === req.user._id.toString(),
    );

    return res.status(existing ? 200 : 201).json({
      message: existing ? "Nộp lại bài thành công" : "Nộp bài thành công",
      submission: savedSubmission,
    });
  } catch (error) {
    console.log("Lỗi nộp bài:", error);

    return res.status(500).json({
      message: "Nộp bài thất bại",
    });
  }
});

// ==================================================
// PATCH /api/v1/assignments/:id/submissions/:studentId/grade
// Admin và Teacher chấm bài
// ==================================================

router.patch(
  "/:id/submissions/:studentId/grade",
  authorizeRoles("admin", "teacher"),
  async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id);

      if (!assignment) {
        return res.status(404).json({
          message: "Không tìm thấy bài tập",
        });
      }

      if (
        req.user.role === "teacher" &&
        assignment.teacherId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          message: "Bạn không có quyền chấm bài này",
        });
      }

      const submission = assignment.submissions.find(
        (item) => item.studentId.toString() === req.params.studentId,
      );

      if (!submission) {
        return res.status(404).json({
          message: "Không tìm thấy bài nộp",
        });
      }

      const score = Number(req.body.score);

      if (!Number.isFinite(score) || score < 0 || score > assignment.maxScore) {
        return res.status(400).json({
          message: `Điểm phải nằm trong khoảng từ 0 đến ${assignment.maxScore}`,
        });
      }

      submission.score = score;
      submission.feedback =
        typeof req.body.feedback === "string" ? req.body.feedback.trim() : "";

      submission.status = "graded";
      submission.gradedBy = req.user._id;
      submission.gradedAt = new Date();

      await assignment.save();

      return res.json({
        message: "Chấm bài thành công",
        submission,
      });
    } catch (error) {
      console.log("Lỗi chấm bài:", error);

      return res.status(500).json({
        message: "Chấm bài thất bại",
      });
    }
  },
);

module.exports = router;
