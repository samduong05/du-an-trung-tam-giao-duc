const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const {
  materialUploadsDir,
  assignmentUploadsDir,
  assignmentSubmissionUploadsDir,
  quizSourceUploadsDir,
} = require("../config/upload");

const MATERIAL_MAX_FILES = 5;
const MATERIAL_MAX_FILE_SIZE = 10 * 1024 * 1024;

const ASSIGNMENT_MAX_FILES = 5;
const ASSIGNMENT_MAX_FILE_SIZE = 10 * 1024 * 1024;

const ASSIGNMENT_SUBMISSION_MAX_FILES = 5;
const ASSIGNMENT_SUBMISSION_MAX_FILE_SIZE = 10 * 1024 * 1024;

const QUIZ_SOURCE_MAX_FILE_SIZE = 5 * 1024 * 1024;

const materialExtensions = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

const materialMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",

  // Một số trình duyệt hoặc công cụ gửi file với MIME này.
  // Phần đuôi file vẫn phải nằm trong whitelist phía trên.
  "application/octet-stream",
]);

const quizSourceExtensions = new Set([".txt", ".docx"]);

const quizSourceMimeTypes = new Set([
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
]);

const createSafeFilename = (originalName) => {
  const extension = path.extname(originalName).toLowerCase();

  return `${Date.now()}-${crypto.randomUUID()}${extension}`;
};

const createStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, destination);
    },

    filename: (req, file, callback) => {
      callback(null, createSafeFilename(file.originalname));
    },
  });
};

const createFileFilter = ({
  allowedExtensions,
  allowedMimeTypes,
  invalidMessage,
}) => {
  return (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const extensionAllowed = allowedExtensions.has(extension);
    const mimeTypeAllowed = allowedMimeTypes.has(file.mimetype);

    if (!extensionAllowed || !mimeTypeAllowed) {
      const error = new Error(invalidMessage);
      error.statusCode = 400;

      return callback(error);
    }

    return callback(null, true);
  };
};

const materialUpload = multer({
  storage: createStorage(materialUploadsDir),

  limits: {
    fileSize: MATERIAL_MAX_FILE_SIZE,
    files: MATERIAL_MAX_FILES,
  },

  fileFilter: createFileFilter({
    allowedExtensions: materialExtensions,
    allowedMimeTypes: materialMimeTypes,
    invalidMessage:
      "Material chỉ hỗ trợ PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, JPEG, PNG hoặc WEBP",
  }),
});

const assignmentUpload = multer({
  storage: createStorage(assignmentUploadsDir),

  limits: {
    fileSize: ASSIGNMENT_MAX_FILE_SIZE,
    files: ASSIGNMENT_MAX_FILES,
  },

  fileFilter: createFileFilter({
    allowedExtensions: materialExtensions,
    allowedMimeTypes: materialMimeTypes,
    invalidMessage:
      "File bài tập chỉ hỗ trợ PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, JPEG, PNG hoặc WEBP",
  }),
});
const assignmentSubmissionUpload = multer({
  storage: createStorage(assignmentSubmissionUploadsDir),

  limits: {
    fileSize: ASSIGNMENT_SUBMISSION_MAX_FILE_SIZE,
    files: ASSIGNMENT_SUBMISSION_MAX_FILES,
  },

  fileFilter: createFileFilter({
    allowedExtensions: materialExtensions,
    allowedMimeTypes: materialMimeTypes,
    invalidMessage:
      "File bài nộp chỉ hỗ trợ PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, JPEG, PNG hoặc WEBP",
  }),
});

const quizSourceUpload = multer({
  storage: createStorage(quizSourceUploadsDir),

  limits: {
    fileSize: QUIZ_SOURCE_MAX_FILE_SIZE,
    files: 1,
  },

  fileFilter: createFileFilter({
    allowedExtensions: quizSourceExtensions,
    allowedMimeTypes: quizSourceMimeTypes,
    invalidMessage: "File nguồn Quiz chỉ hỗ trợ định dạng TXT hoặc DOCX",
  }),
});

const uploadMaterialFiles = materialUpload.array("files", MATERIAL_MAX_FILES);

const uploadAssignmentFiles = assignmentUpload.array(
  "files",
  ASSIGNMENT_MAX_FILES,
);
const uploadAssignmentSubmissionFiles = assignmentSubmissionUpload.array(
  "files",
  ASSIGNMENT_SUBMISSION_MAX_FILES,
);
const uploadQuizSource = quizSourceUpload.single("file");

module.exports = {
  uploadMaterialFiles,
  uploadAssignmentFiles,
  uploadAssignmentSubmissionFiles,
  uploadQuizSource,
};

