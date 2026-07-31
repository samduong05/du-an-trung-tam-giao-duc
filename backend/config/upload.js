const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "..", "uploads");

const materialUploadsDir = path.join(uploadsDir, "materials");
const assignmentUploadsDir = path.join(uploadsDir, "assignments");
const quizSourceUploadsDir = path.join(uploadsDir, "quiz-sources");

const uploadDirectories = [
  uploadsDir,
  materialUploadsDir,
  assignmentUploadsDir,
  quizSourceUploadsDir,
];

const ensureUploadsDir = () => {
  uploadDirectories.forEach((directory) => {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, {
        recursive: true,
      });
    }
  });
};

module.exports = {
  uploadsDir,
  materialUploadsDir,
  assignmentUploadsDir,
  quizSourceUploadsDir,
  ensureUploadsDir,
};
