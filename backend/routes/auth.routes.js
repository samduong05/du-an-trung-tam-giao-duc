const express = require("express");
const {
  authentication,
  authLimiter,
} = require("../middlewares/auth.middleware");
const {
  login,
  
  changePassword,
  
  getMe,
  logout,
} = require("../controllers/auth.controller");
const { requireMongoConnection } = require("../middlewares/mongo.middleware");
const {
  sendResetOtp,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/passwordReset.controller");
const router = express.Router();

router.post("/login", authLimiter, requireMongoConnection,  login);
router.post("/forgot-password", authLimiter, sendResetOtp);
router.post("/verify-reset-otp", authLimiter, verifyResetOtp);
router.post("/reset-password", authLimiter, resetPassword);
// router.post("/forgot-password", requireMongoConnection, forgotPassword);
// router.post("/register", requireMongoConnection, register);
router.get("/me", requireMongoConnection, authentication, getMe);
router.post("/logout", requireMongoConnection, authentication, logout);
router.put(
  "/change-password",
  requireMongoConnection,
  authentication,
  changePassword,
);
module.exports = router;
