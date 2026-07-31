const express = require("express");

const {
  uploadMaterialFiles: handleUploadMaterialFiles,
  uploadAssignmentFiles: handleUploadAssignmentFiles,
} = require("../controllers/upload.controller");

const {
  uploadMaterialFiles,
  uploadAssignmentFiles,
} = require("../middlewares/upload.middleware");

const {
  authentication,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authentication);

// POST /api/v1/uploads/materials
router.post(
  "/materials",
  authorizeRoles("admin", "teacher"),
  uploadMaterialFiles,
  handleUploadMaterialFiles,
);

// POST /api/v1/uploads/assignments
router.post(
  "/assignments",
  authorizeRoles("admin", "teacher"),
  uploadAssignmentFiles,
  handleUploadAssignmentFiles,
);

module.exports = router;