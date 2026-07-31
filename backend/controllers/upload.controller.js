const path = require("path");

const getUploadedFileMetadata = (file, uploadFolder) => {
  return {
    name: file.originalname,
    url: `/uploads/${uploadFolder}/${file.filename}`,
    type: file.mimetype,
    size: file.size,
  };
};

// POST /api/v1/uploads/materials
const uploadMaterialFiles = async (req, res) => {
  const files = req.files || [];

  if (files.length === 0) {
    return res.status(400).json({
      message: "Vui lòng chọn ít nhất một file",
    });
  }

  const uploadedFiles = files.map((file) =>
    getUploadedFileMetadata(file, "materials"),
  );

  return res.status(201).json({
    message: "Tải file Material lên thành công",
    count: uploadedFiles.length,
    files: uploadedFiles,
  });
};

// Sẽ dùng ở phần Assignment sau
const uploadAssignmentFiles = async (req, res) => {
  const files = req.files || [];

  if (files.length === 0) {
    return res.status(400).json({
      message: "Vui lòng chọn ít nhất một file",
    });
  }

  const uploadedFiles = files.map((file) =>
    getUploadedFileMetadata(file, "assignments"),
  );

  return res.status(201).json({
    message: "Tải file bài tập lên thành công",
    count: uploadedFiles.length,
    files: uploadedFiles,
  });
};

// Middleware Quiz đã có, nhưng controller này hiện chỉ trả metadata.
// Logic đọc TXT/DOCX sẽ được làm trong quiz import controller riêng.
const uploadQuizSourceFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Vui lòng chọn file nguồn Quiz",
    });
  }

  const extension = path
    .extname(req.file.originalname)
    .toLowerCase()
    .replace(".", "");

  const sourceFile = {
    name: req.file.originalname,
    url: `/uploads/quiz-sources/${req.file.filename}`,
    type: extension,
    size: req.file.size,
  };

  return res.status(201).json({
    message: "Tải file nguồn Quiz lên thành công",
    sourceFile,
  });
};

module.exports = {
  uploadMaterialFiles,
  uploadAssignmentFiles,
  uploadQuizSourceFile,
};
