const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const {
  uploadsDir,
  ensureUploadsDir,
} = require("./config/upload");
const mongoErrorMiddleware = require("./middlewares/mongoError.middleware");
const errorMiddleware = require("./middlewares/error.middleware");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const classRoutes = require("./routes/class.routes");
const materialRoutes = require("./routes/material.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const quizRoutes = require("./routes/quiz.routes");
const quizSubmissionRoutes = require("./routes/quizSubmission.routes");
const assignmentRoutes = require("./routes/assignment.routes");
const uploadRoutes = require("./routes/upload.routes");
const app = express();

ensureUploadsDir();

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));


app.get("/", (req, res) => {
  res.send("Backend dang chay");
});

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/classes", classRoutes);
app.use("/api/v1/materials", materialRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/quizzes", quizRoutes);
app.use("/api/v1/quiz-submissions", quizSubmissionRoutes);
app.use("/api/v1/assignments", assignmentRoutes);
app.use("/api/v1/uploads", uploadRoutes);

app.use(mongoErrorMiddleware);
app.use(errorMiddleware);

module.exports = app;
