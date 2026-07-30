const mongoose = require("mongoose");
const Material = require("../models/Material.model");
const Class = require("../models/Class.model");

const MATERIAL_STATUSES = ["published", "hidden"];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Kiểm tra người dùng có quyền truy cập lớp hay không
const checkClassAccess = async (classId, user) => {
  if (!isValidObjectId(classId)) {
    return {
      error: {
        status: 400,
        message: "classId không hợp lệ",
      },
    };
  }

  const classData = await Class.findById(classId);

  if (!classData) {
    return {
      error: {
        status: 404,
        message: "Không tìm thấy lớp học",
      },
    };
  }

  // Admin truy cập tất cả lớp
  if (user.role === "admin") {
    return {
      classData,
    };
  }

  // Giáo viên chỉ truy cập lớp mình phụ trách
  if (user.role === "teacher") {
    if (
      !classData.teacher ||
      classData.teacher.toString() !== user._id.toString()
    ) {
      return {
        error: {
          status: 403,
          message: "Bạn không có quyền quản lý tài liệu của lớp này",
        },
      };
    }

    return {
      classData,
    };
  }

  // Học sinh chỉ truy cập lớp mình đang học
  if (user.role === "student") {
    const isStudentInClass = classData.students.some(
      (studentId) => studentId.toString() === user._id.toString(),
    );

    if (!isStudentInClass) {
      return {
        error: {
          status: 403,
          message: "Bạn không thuộc lớp học này",
        },
      };
    }

    return {
      classData,
    };
  }

  return {
    error: {
      status: 403,
      message: "Bạn không có quyền truy cập lớp học này",
    },
  };
};

// POST /api/v1/materials
const createMaterial = async (req, res) => {
  try {
    const {
      classId,
      title,
      description,
      files = [],
      links = [],
      status = "published",
    } = req.body;

    if (!classId) {
      return res.status(400).json({
        message: "Vui lòng nhập classId",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Vui lòng nhập tiêu đề tài liệu",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        message: "Vui lòng nhập mô tả tài liệu",
      });
    }

    if (!MATERIAL_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Trạng thái tài liệu không hợp lệ",
      });
    }

    if (!Array.isArray(files)) {
      return res.status(400).json({
        message: "files phải là một mảng",
      });
    }

    if (!Array.isArray(links)) {
      return res.status(400).json({
        message: "links phải là một mảng",
      });
    }

    const accessResult = await checkClassAccess(classId, req.user);

    if (accessResult.error) {
      return res.status(accessResult.error.status).json({
        message: accessResult.error.message,
      });
    }

    const { classData } = accessResult;

    if (!classData.teacher) {
      return res.status(400).json({
        message: "Lớp học chưa có giáo viên phụ trách",
      });
    }

    const material = await Material.create({
      classId: classData._id,

      // Luôn lấy giáo viên đang phụ trách lớp
      teacherId: classData.teacher,

      title: title.trim(),
      description: description.trim(),
      files,
      links,
      status,
    });

    const populatedMaterial = await Material.findById(material._id)
      .populate("classId", "name description")
      .populate("teacherId", "name email");

    return res.status(201).json({
      message: "Tạo tài liệu thành công",
      material: populatedMaterial,
    });
  } catch (error) {
    console.log("Lỗi tạo tài liệu:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Lỗi server khi tạo tài liệu",
    });
  }
};

// GET /api/v1/materials
// Có thể lọc:
// ?classId=...
// ?status=published
// ?search=grammar
const getMaterials = async (req, res) => {
  try {
    const { classId, status, search } = req.query;

    const filter = {};

    if (status && !MATERIAL_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Trạng thái tài liệu không hợp lệ",
      });
    }

    if (search && search.trim()) {
      filter.$or = [
        {
          title: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          description: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    /*
     * Khi có classId:
     * kiểm tra trực tiếp người dùng có quyền xem lớp đó hay không.
     */
    if (classId) {
      const accessResult = await checkClassAccess(classId, req.user);

      if (accessResult.error) {
        return res.status(accessResult.error.status).json({
          message: accessResult.error.message,
        });
      }

      filter.classId = classId;
    } else {
      /*
       * Khi không có classId:
       * tìm tất cả lớp người dùng có quyền truy cập.
       */
      if (req.user.role === "teacher") {
        const classes = await Class.find({
          teacher: req.user._id,
        }).select("_id");

        filter.classId = {
          $in: classes.map((classData) => classData._id),
        };
      }

      if (req.user.role === "student") {
        const classes = await Class.find({
          students: req.user._id,
        }).select("_id");

        filter.classId = {
          $in: classes.map((classData) => classData._id),
        };
      }
    }

    // Học sinh chỉ được xem tài liệu đã công khai
    if (req.user.role === "student") {
      filter.status = "published";
    } else if (status) {
      filter.status = status;
    }

    const materials = await Material.find(filter)
      .populate("classId", "name description")
      .populate("teacherId", "name email")
      .sort({
        createdAt: -1,
      });

    return res.json({
      count: materials.length,
      materials,
    });
  } catch (error) {
    console.log("Lỗi lấy danh sách tài liệu:", error);

    return res.status(500).json({
      message: "Lỗi server khi lấy danh sách tài liệu",
    });
  }
};

// GET /api/v1/materials/:id
const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Material ID không hợp lệ",
      });
    }

    const material = await Material.findById(id)
      .populate("classId", "name description teacher students")
      .populate("teacherId", "name email");

    if (!material) {
      return res.status(404).json({
        message: "Không tìm thấy tài liệu",
      });
    }

    const classData = material.classId;

    if (!classData) {
      return res.status(404).json({
        message: "Lớp học của tài liệu không còn tồn tại",
      });
    }

    if (req.user.role === "teacher") {
      if (
        !classData.teacher ||
        classData.teacher.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          message: "Bạn không có quyền xem tài liệu này",
        });
      }
    }

    if (req.user.role === "student") {
      const isStudentInClass = classData.students.some(
        (studentId) => studentId.toString() === req.user._id.toString(),
      );

      if (!isStudentInClass) {
        return res.status(403).json({
          message: "Bạn không thuộc lớp học này",
        });
      }

      if (material.status !== "published") {
        return res.status(403).json({
          message: "Tài liệu này chưa được công khai",
        });
      }
    }

    return res.json({
      material,
    });
  } catch (error) {
    console.log("Lỗi lấy chi tiết tài liệu:", error);

    return res.status(500).json({
      message: "Lỗi server khi lấy chi tiết tài liệu",
    });
  }
};

// PUT /api/v1/materials/:id
const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const { classId, title, description, files, links, status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Material ID không hợp lệ",
      });
    }

    const material = await Material.findById(id);

    if (!material) {
      return res.status(404).json({
        message: "Không tìm thấy tài liệu",
      });
    }

    // Kiểm tra quyền đối với lớp hiện tại
    const currentClassAccess = await checkClassAccess(
      material.classId,
      req.user,
    );

    if (currentClassAccess.error) {
      return res.status(currentClassAccess.error.status).json({
        message: currentClassAccess.error.message,
      });
    }

    /*
     * Nếu thay đổi classId thì phải kiểm tra quyền
     * đối với lớp mới.
     */
    if (classId && classId !== material.classId.toString()) {
      const newClassAccess = await checkClassAccess(classId, req.user);

      if (newClassAccess.error) {
        return res.status(newClassAccess.error.status).json({
          message: newClassAccess.error.message,
        });
      }

      if (!newClassAccess.classData.teacher) {
        return res.status(400).json({
          message: "Lớp học mới chưa có giáo viên phụ trách",
        });
      }

      material.classId = newClassAccess.classData._id;
      material.teacherId = newClassAccess.classData.teacher;
    }

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({
          message: "Tiêu đề tài liệu không được để trống",
        });
      }

      material.title = title.trim();
    }

    if (description !== undefined) {
      if (!description || !description.trim()) {
        return res.status(400).json({
          message: "Mô tả tài liệu không được để trống",
        });
      }

      material.description = description.trim();
    }

    if (files !== undefined) {
      if (!Array.isArray(files)) {
        return res.status(400).json({
          message: "files phải là một mảng",
        });
      }

      material.files = files;
    }

    if (links !== undefined) {
      if (!Array.isArray(links)) {
        return res.status(400).json({
          message: "links phải là một mảng",
        });
      }

      material.links = links;
    }

    if (status !== undefined) {
      if (!MATERIAL_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Trạng thái tài liệu không hợp lệ",
        });
      }

      material.status = status;
    }

    await material.save();

    const updatedMaterial = await Material.findById(material._id)
      .populate("classId", "name description")
      .populate("teacherId", "name email");

    return res.json({
      message: "Cập nhật tài liệu thành công",
      material: updatedMaterial,
    });
  } catch (error) {
    console.log("Lỗi cập nhật tài liệu:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Lỗi server khi cập nhật tài liệu",
    });
  }
};

// DELETE /api/v1/materials/:id
const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Material ID không hợp lệ",
      });
    }

    const material = await Material.findById(id);

    if (!material) {
      return res.status(404).json({
        message: "Không tìm thấy tài liệu",
      });
    }

    const accessResult = await checkClassAccess(material.classId, req.user);

    if (accessResult.error) {
      return res.status(accessResult.error.status).json({
        message: accessResult.error.message,
      });
    }

    await material.deleteOne();

    return res.json({
      message: "Xóa tài liệu thành công",
    });
  } catch (error) {
    console.log("Lỗi xóa tài liệu:", error);

    return res.status(500).json({
      message: "Lỗi server khi xóa tài liệu",
    });
  }
};

module.exports = {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
};
