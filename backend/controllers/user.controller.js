const bcrypt = require("bcrypt");
const User = require("../models/User.model");
const Class = require("../models/Class.model");

// Kiểm tra student có thuộc ít nhất một lớp của teacher hay không
const isStudentOfTeacher = async (teacherId, studentId) => {
  const classData = await Class.findOne({
    teacher: teacherId,
    students: studentId,
  }).select("_id");

  return Boolean(classData);
};

// POST /api/v1/users
// POST /api/v1/users
const createUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const role = req.user.role === "teacher" ? "student" : req.body.role;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ name, email và password",
      });
    }

    if (req.user.role === "admin" && !role) {
      return res.status(400).json({
        message: "Vui lòng chọn role",
      });
    }

    if (!["teacher", "student"].includes(role)) {
      return res.status(400).json({
        message: "Chỉ được tạo teacher hoặc student",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existedUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existedUser) {
      return res.status(400).json({
        message: "Email đã tồn tại",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      phone: typeof phone === "string" ? phone.trim() : phone,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message:
        req.user.role === "teacher"
          ? "Tạo học sinh thành công"
          : "Tạo user thành công",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        createdBy: user.createdBy,
      },
    });
  } catch (error) {
    console.error("Lỗi tạo user:", error);

    if (error?.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0];

      return res.status(400).json({
        message:
          duplicatedField === "phone"
            ? "Số điện thoại đã tồn tại"
            : "Thông tin tài khoản đã tồn tại",
      });
    }

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};
// GET /api/v1/users
const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    const filter = {};

    if (req.user.role === "teacher") {
      /*
        Lấy ID của tất cả student thuộc các lớp
        mà teacher hiện tại đang phụ trách.
      */
      const studentIds = await Class.distinct("students", {
        teacher: req.user._id,
      });

      filter._id = {
        $in: studentIds,
      };

      filter.role = "student";
    } else {
      // Admin được xem teacher và student, không lấy admin
      filter.role = {
        $in: ["teacher", "student"],
      };

      if (role) {
        if (!["teacher", "student"].includes(role)) {
          return res.status(400).json({
            message: "Role không hợp lệ",
          });
        }

        filter.role = role;
      }
    }

    if (search) {
      const searchValue = search.trim();

      filter.$or = [
        {
          name: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          email: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: searchValue,
            $options: "i",
          },
        },
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Lấy danh sách user thành công",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách user:", error);

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// GET /api/v1/users/:id
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy user",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Không được xem tài khoản admin",
      });
    }

    if (req.user.role === "teacher") {
      if (user.role !== "student") {
        return res.status(403).json({
          message: "Teacher chỉ được xem tài khoản student",
        });
      }

      const allowed = await isStudentOfTeacher(req.user._id, user._id);

      if (!allowed) {
        return res.status(403).json({
          message: "Student không thuộc lớp bạn phụ trách",
        });
      }
    }

    return res.status(200).json({
      message: "Lấy chi tiết user thành công",
      user,
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết user:", error);

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// PUT /api/v1/users/:id
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, isActive } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy user",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Không được sửa tài khoản admin",
      });
    }

    if (
      req.user.role === "admin" &&
      req.user._id.toString() === id &&
      isActive === false
    ) {
      return res.status(403).json({
        message: "Không thể khóa chính tài khoản của bạn",
      });
    }

    if (req.user.role === "teacher") {
      if (user.role !== "student") {
        return res.status(403).json({
          message: "Teacher chỉ được sửa tài khoản student",
        });
      }

      const allowed = await isStudentOfTeacher(req.user._id, user._id);

      if (!allowed) {
        return res.status(403).json({
          message: "Student không thuộc lớp bạn phụ trách",
        });
      }

      /*
        Teacher chỉ được sửa thông tin cơ bản.
        Không được sửa email hoặc role.
      */
      if (email !== undefined || role !== undefined || isActive !== undefined) {
        return res.status(403).json({
          message:
            "Teacher không được sửa email, role hoặc trạng thái của student",
        });
      }

      if (name !== undefined) {
        user.name = name.trim();
      }

      if (phone !== undefined) {
        user.phone = phone;
      }
    } else {
      // Phần cập nhật dành cho admin
      if (role !== undefined) {
        if (!["teacher", "student"].includes(role)) {
          return res.status(400).json({
            message: "Role không hợp lệ",
          });
        }

        user.role = role;
      }

      if (email !== undefined) {
        const normalizedEmail = email.toLowerCase().trim();

        if (normalizedEmail !== user.email) {
          const existedUser = await User.findOne({
            email: normalizedEmail,
            _id: {
              $ne: id,
            },
          });

          if (existedUser) {
            return res.status(400).json({
              message: "Email đã tồn tại",
            });
          }

          user.email = normalizedEmail;
        }
      }

      if (name !== undefined) {
        user.name = name.trim();
      }

      if (phone !== undefined) {
        user.phone = phone;
      }

      if (isActive !== undefined) {
        if (typeof isActive !== "boolean") {
          return res.status(400).json({
            message: "isActive phải là boolean",
          });
        }

        user.isActive = isActive;
      }
    }

    await user.save();

    return res.status(200).json({
      message: "Cập nhật user thành công",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Lỗi cập nhật user:", error);

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};

// DELETE /api/v1/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra thêm trong controller để bảo vệ,
    // dù route cũng nên giới hạn admin.
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Chỉ admin được xóa tài khoản user",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy user",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Không được xóa tài khoản admin",
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Xóa user thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa user:", error);

    return res.status(500).json({
      message: "Lỗi server",
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
