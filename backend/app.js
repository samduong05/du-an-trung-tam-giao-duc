const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { ensureUploadsDir } = require("./config/upload");
const mongoErrorMiddleware = require("./middlewares/mongoError.middleware");
const errorMiddleware = require("./middlewares/error.middleware");

const authRoutes = require("./routes/auth.routes");

const userRoutes = require("./routes/user.routes");
const classRoutes = require("./routes/class.routes");

const materialRoutes = require("./routes/material.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const quizRoutes = require("./routes/quiz.routes");
const quizSubmissionRoutes = require("./routes/quizSubmission.routes");
const assignment = require("./routes/assignment.routes");
// const adminRoutes = require("./routes/admin.routes");
// const progressRoutes = require("./routes/progress.routes");

const app = express();
app.use(helmet());
ensureUploadsDir();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

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
app.use("/api/v1/assignments", assignment);
// app.use("/api/v1/admin", adminRoutes);
// app.use("/api/v1/progress", progressRoutes);

app.use(mongoErrorMiddleware);
app.use(errorMiddleware);

module.exports = app;
