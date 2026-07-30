const express = require("express");
const {
  getStudentProgressSummary,
} = require("../controllers/progress.controller");
const { requireMongoConnection } = require("../middlewares/mongo.middleware");

const router = express.Router();

router.get(
  "/student-progress-summary",
  requireMongoConnection,
  getStudentProgressSummary,
);

module.exports = router;
