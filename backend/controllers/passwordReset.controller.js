const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User.model");
const emailTransporter = require("../config/email");

const {
  
  hashResetValue,
} = require("../utils/passwordReset.utils");

const sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Vui lòng nhập email",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    /*
      Không nên thông báo rõ email có tồn tại hay không,
      vì người lạ có thể dùng endpoint để dò tài khoản.
    */
    if (!user) {
      return res.status(200).json({
        message:
          "Nếu email tồn tại trong hệ thống, mã OTP sẽ được gửi đến email đó",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    const hashedOtp = hashResetValue(otp);

    user.passwordResetOtp = hashedOtp;

    user.passwordResetOtpExpires = Date.now() + 10 * 60 * 1000;

    /*
      Hủy reset token cũ nếu người dùng yêu cầu OTP mới.
    */
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;

    await user.save();

    try {
      await emailTransporter.sendMail({
        from: `"English Center LMS" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Mã xác nhận đặt lại mật khẩu",
        text: `
Mã OTP đặt lại mật khẩu của bạn là: ${otp}

Mã này có hiệu lực trong 10 phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
        `.trim(),
      });
    } catch (emailError) {
      /*
        Nếu gửi email thất bại thì xóa OTP,
        tránh để lại mã reset không sử dụng được.
      */
      user.passwordResetOtp = null;
      user.passwordResetOtpExpires = null;

      await user.save();

      console.log("Lỗi gửi email OTP:", emailError);

      return res.status(500).json({
        message: "Không thể gửi mã OTP",
      });
    }

    return res.status(200).json({
      message:
        "Nếu email tồn tại trong hệ thống, mã OTP sẽ được gửi đến email đó",
    });
  } catch (error) {
    console.log("Lỗi gửi OTP:", error);

    return res.status(500).json({
      message: "Gửi mã OTP thất bại",
      error: error.message,
    });
  }
};
const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Vui lòng nhập email và mã OTP",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const hashedOtp = hashResetValue(otp.toString());

    const user = await User.findOne({
      email: normalizedEmail,
      passwordResetOtp: hashedOtp,
      passwordResetOtpExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Mã OTP không hợp lệ hoặc đã hết hạn",
      });
    }

    /*
      Tạo reset token ngẫu nhiên.
      Token nguyên bản trả về frontend.
      Database chỉ lưu bản hash.
    */
    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedResetToken = hashResetValue(resetToken);

    user.passwordResetToken = hashedResetToken;

    user.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

    /*
      OTP dùng một lần.
      Xác minh xong thì xóa ngay.
    */
    user.passwordResetOtp = null;
    user.passwordResetOtpExpires = null;

    await user.save();

    return res.status(200).json({
      message: "Xác minh OTP thành công",
      resetToken,
    });
  } catch (error) {
    console.log("Lỗi xác minh OTP:", error);

    return res.status(500).json({
      message: "Xác minh OTP thất bại",
      error: error.message,
    });
  }
};
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập resetToken, mật khẩu mới và xác nhận mật khẩu",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Mật khẩu xác nhận không khớp",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
    }

    const hashedResetToken = hashResetValue(resetToken);

    const user = await User.findOne({
      passwordResetToken: hashedResetToken,
      passwordResetTokenExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Reset token không hợp lệ hoặc đã hết hạn",
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        message: "Mật khẩu mới phải khác mật khẩu hiện tại",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    /*
      Xóa toàn bộ dữ liệu reset sau khi đổi thành công.
    */
    user.passwordResetOtp = null;
    user.passwordResetOtpExpires = null;
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;

    await user.save();

    return res.status(200).json({
      message:
        "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới",
    });
  } catch (error) {
    console.log("Lỗi đặt lại mật khẩu:", error);

    return res.status(500).json({
      message: "Đặt lại mật khẩu thất bại",
      error: error.message,
    });
  }
};
module.exports = {
  sendResetOtp,
  verifyResetOtp,
  resetPassword,
};
