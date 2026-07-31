const multer = require("multer");

const errorMiddleware = (error, req, res, next) => {
  console.log("Lỗi server:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "File vượt quá dung lượng cho phép",
      });
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "Số lượng file vượt quá giới hạn cho phép",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "Tên trường file hoặc số lượng file không hợp lệ",
      });
    }

    return res.status(400).json({
      message: "Không thể tải file lên",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  return res.status(500).json({
    message: "Lỗi server",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : undefined,
  });
};

module.exports = errorMiddleware;