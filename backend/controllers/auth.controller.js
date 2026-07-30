const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Vui long nhap email va password",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({
        message: "Sai tai khoan hoac mat khau",
      });
    }
    if (!user.isActive) {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Sai tai khoan hoac mat khau",
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7h" },
    );

    return res.json({
      message: "Login thanh cong",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Loi login:", error);

    return res.status(500).json({
      message: "Login that bai",
    });
  }
};
const getMe = async (req, res) => {
  res.status(200).json({
    message: "Lay thong tin user thanh cong",
    user: req.user,
  });
};

// const forgotPassword = async (req, res) => {
//   try {
//     const { email, newPassword } = req.body;

//     if (!email || !newPassword) {
//       return res.status(400).json({
//         message: "Vui long nhap email va mat khau moi",
//       });
//     }

//     const user = await User.findOne({ email: email.toLowerCase() });

//     if (!user) {
//       return res.status(400).json({
//         message: "Email khong ton tai",
//       });
//     }

//     user.password = await bcrypt.hash(newPassword, 10);
//     await user.save();

//     return res.json({
//       message: "Doi mat khau thanh cong",
//     });
//   } catch (error) {
//     console.log("Loi forgot password:", error);

//     return res.status(500).json({
//       message: "Doi mat khau that bai",
//     });
//   }
// };
const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Vui long nhap mat khau cu va mat khau moi",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mat khau moi phai co it nhat 6 ky tu",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "Tai khoan khong ton tai",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Mat khau cu khong dung",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    return res.status(200).json({
      message: "Doi mat khau thanh cong",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Loi server khi doi mat khau",
      error: error.message,
    });
  }
};
const logout = async (req, res) => {
  try {
    return res.status(200).json({
      message: "Dang xuat thanh cong",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Loi server khi dang xuat",
      error: error.message,
    });
  }
};
// const register = async (req, res) => {
//   console.log("Nhan request register");

//   try {
//     const { name, email, password, role } = req.body;
//     const allowedRoles = ["student", "teacher", "admin"];
//     const finalRole = allowedRoles.includes(role) ? role : "student";
//     if (!name || !email || !password) {
//       return res.status(400).json({
//         message: "Vui long nhap day du thong tin",
//       });
//     }

//     console.log("Body:", {
//       name,
//       email,
//       role: finalRole,
//     });

//     const existingUser = await User.findOne({ email: email.toLowerCase() });

//     if (existingUser) {
//       console.log("Email da ton tai:", email);

//       return res.status(400).json({
//         message: "Email da ton tai",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       name,
//       email: email.toLowerCase(),
//       password: hashedPassword,
//       role: finalRole,
//     });

//     console.log("Da tao user:", user.email);

//     return res.status(201).json({
//       message: "Dang ky thanh cong",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.log("Loi register:", error);

//     return res.status(500).json({
//       message: "Dang ky that bai",
//       error: error.message,
//     });
//   }
// };

module.exports = {
  login,
  // forgotPassword,
  changePassword,
  // register,
  getMe,
  logout,
};
