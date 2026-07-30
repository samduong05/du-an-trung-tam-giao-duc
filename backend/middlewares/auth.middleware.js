const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const rateLimit = require("express-rate-limit");

const authentication = async (req, res, next) => {
  try {
    let token;

    // Lấy token từ header Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Nếu không có token
    if (!token) {
      return res.status(401).json({
        message: "Chua dang nhap, khong co token",
      });
    }

    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user từ id trong token
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Tài khoản không tồn tại hoặc đã bị khóa",
      });
    }

    // Gắn user vào req để controller phía sau dùng
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token khong hop le hoac da het han",
    });
  }
};
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Ban chua dang nhap",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Ban chua duoc phan quyen de lam viec nay",
      });
    }

    next();
  };
};
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau",
  },
});

module.exports = { authentication, authorizeRoles, authLimiter };
