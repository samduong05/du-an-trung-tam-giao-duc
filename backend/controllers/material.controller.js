const mongoose = require("mongoose");

const Material = require("../models/Material.model");
const Class = require("../models/Class.model");

const MATERIAL_TYPES = ["curriculum", "supplementary"];
const MATERIAL_STATUSES = ["published", "hidden"];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeObjectIds = (ids) => {
  return [...new Set(ids.map((id) => id.toString()))];
};

const validateClassIds = (classIds) => {
  if (!Array.isArray(classIds) || classIds.length === 0) {
    return "classIds phải là một mảng và có ít nhất một lớp học";
  }

  const normalizedClassIds = normalizeObjectIds(classIds);

  const hasInvalidId = normalizedClassIds.some(
    (classId) => !isValidObjectId(classId),
  );

  if (hasInvalidId) {
    return "Một hoặc nhiều classIds không hợp lệ";
  }

  return null;
};

const getClassesByIds = async (classIds) => {
  const normalizedClassIds = normalizeObjectIds(classIds);

  const classes = await Class.find({
    _id: {
      $in: normalizedClassIds,
    },
  }).select("_id name teacher students");

  if (classes.length !== normalizedClassIds.length) {
    return {
      error: {
        status: 404,
        message: "Một hoặc nhiều lớp học không tồn tại",
      },
    };
  }

  return {
    classes,
    normalizedClassIds,
  };
};

const teacherOwnsAllClasses = (classes, teacherId) => {
  return classes.every(
    (classData) =>
      classData.teacher &&
      classData.teacher.toString() === teacherId.toString(),
  );
};

const getAccessibleClassIds = async (user) => {
  if (user.role === "admin") {
    return null;
  }

  if (user.role === "teacher") {
    const classes = await Class.find({
      teacher: user._id,
    }).select("_id");

    return classes.map((classData) => classData._id);
  }

  if (user.role === "student") {
    const classes = await Class.find({
      students: user._id,
    }).select("_id");

    return classes.map((classData) => classData._id);
  }

  return [];
};

const canAccessMaterial = async (material, user) => {
  if (user.role === "admin") {
    return true;
  }

  if (user.role === "student" && material.status !== "published") {
    return false;
  }

  const accessibleClassIds = await getAccessibleClassIds(user);

  const accessibleClassIdSet = new Set(
    accessibleClassIds.map((classId) => classId.toString()),
  );

  return material.classIds.some((classId) => {
    const id = classId?._id || classId;

    return accessibleClassIdSet.has(id.toString());
  });
};

// POST /api/v1/materials
const createMaterial = async (req, res) => {
  try {
    const {
      classIds,
      materialType,
      title,
      description = "",
      files = [],
      links = [],
      status = "published",
    } = req.body;

    const classIdsError = validateClassIds(classIds);

    if (classIdsError) {
      return res.status(400).json({
        message: classIdsError,
      });
    }

    if (!MATERIAL_TYPES.includes(materialType)) {
      return res.status(400).json({
        message: "Loại tài liệu không hợp lệ",
      });
    }

    if (req.user.role === "admin" && materialType !== "curriculum") {
      return res.status(403).json({
        message: "Admin chỉ tạo giáo trình chính thức",
      });
    }

    if (req.user.role === "teacher" && materialType !== "supplementary") {
      return res.status(403).json({
        message: "Giáo viên chỉ được tạo tài liệu bổ sung",
      });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Vui lòng nhập tiêu đề tài liệu",
      });
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({
        message: "Mô tả tài liệu không hợp lệ",
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

    if (!MATERIAL_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Trạng thái tài liệu không hợp lệ",
      });
    }

    const classResult = await getClassesByIds(classIds);

    if (classResult.error) {
      return res.status(classResult.error.status).json({
        message: classResult.error.message,
      });
    }

    const { classes, normalizedClassIds } = classResult;

    if (
      req.user.role === "teacher" &&
      !teacherOwnsAllClasses(classes, req.user._id)
    ) {
      return res.status(403).json({
        message: "Bạn chỉ được tạo tài liệu cho lớp mình phụ trách",
      });
    }

    const material = await Material.create({
      classIds: normalizedClassIds,
      createdBy: req.user._id,
      materialType,
      title: title.trim(),
      description: description.trim(),
      files,
      links,
      status,
    });

    const populatedMaterial = await Material.findById(material._id)
      .populate("classIds", "name description subject status")
      .populate("createdBy", "name email role");

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
// ?classId=...
// ?materialType=curriculum
// ?status=published
// ?search=grammar
const getMaterials = async (req, res) => {
  try {
    const { classId, materialType, status, search } = req.query;

    const filter = {};

    if (classId && !isValidObjectId(classId)) {
      return res.status(400).json({
        message: "classId không hợp lệ",
      });
    }

    if (materialType && !MATERIAL_TYPES.includes(materialType)) {
      return res.status(400).json({
        message: "Loại tài liệu không hợp lệ",
      });
    }

    if (status && !MATERIAL_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Trạng thái tài liệu không hợp lệ",
      });
    }

    if (materialType) {
      filter.materialType = materialType;
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

    if (req.user.role === "admin") {
      if (classId) {
        filter.classIds = classId;
      }

      if (status) {
        filter.status = status;
      }
    } else {
      const accessibleClassIds = await getAccessibleClassIds(req.user);

      const accessibleClassIdStrings = new Set(
        accessibleClassIds.map((id) => id.toString()),
      );

      if (classId) {
        if (!accessibleClassIdStrings.has(classId.toString())) {
          return res.status(403).json({
            message:
              req.user.role === "teacher"
                ? "Bạn không phụ trách lớp học này"
                : "Bạn không thuộc lớp học này",
          });
        }

        filter.classIds = classId;
      } else {
        filter.classIds = {
          $in: accessibleClassIds,
        };
      }

      if (req.user.role === "student") {
        filter.status = "published";
      } else if (status) {
        filter.status = status;
      }
    }

    const materials = await Material.find(filter)
      .populate("classIds", "name description subject status")
      .populate("createdBy", "name email role")
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
      .populate("classIds", "name description subject status teacher students")
      .populate("createdBy", "name email role");

    if (!material) {
      return res.status(404).json({
        message: "Không tìm thấy tài liệu",
      });
    }

    const hasAccess = await canAccessMaterial(material, req.user);

    if (!hasAccess) {
      return res.status(403).json({
        message:
          req.user.role === "student" && material.status !== "published"
            ? "Tài liệu này chưa được công khai"
            : "Bạn không có quyền xem tài liệu này",
      });
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

    const { classIds, materialType, title, description, files, links, status } =
      req.body;

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

    if (req.user.role === "teacher") {
      if (material.materialType !== "supplementary") {
        return res.status(403).json({
          message: "Giáo viên không được sửa giáo trình chính thức",
        });
      }

      const currentClassResult = await getClassesByIds(material.classIds);

      if (currentClassResult.error) {
        return res.status(currentClassResult.error.status).json({
          message: currentClassResult.error.message,
        });
      }

      if (!teacherOwnsAllClasses(currentClassResult.classes, req.user._id)) {
        return res.status(403).json({
          message: "Bạn không có quyền sửa tài liệu của lớp này",
        });
      }

      if (
        materialType !== undefined &&
        materialType !== material.materialType
      ) {
        return res.status(403).json({
          message: "Giáo viên không được thay đổi loại tài liệu",
        });
      }
    }

    if (classIds !== undefined) {
      const classIdsError = validateClassIds(classIds);

      if (classIdsError) {
        return res.status(400).json({
          message: classIdsError,
        });
      }

      const newClassResult = await getClassesByIds(classIds);

      if (newClassResult.error) {
        return res.status(newClassResult.error.status).json({
          message: newClassResult.error.message,
        });
      }

      if (
        req.user.role === "teacher" &&
        !teacherOwnsAllClasses(newClassResult.classes, req.user._id)
      ) {
        return res.status(403).json({
          message: "Bạn chỉ được chuyển tài liệu sang lớp mình phụ trách",
        });
      }

      material.classIds = newClassResult.normalizedClassIds;
    }

    if (materialType !== undefined) {
      if (!MATERIAL_TYPES.includes(materialType)) {
        return res.status(400).json({
          message: "Loại tài liệu không hợp lệ",
        });
      }

      material.materialType = materialType;
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          message: "Tiêu đề tài liệu không được để trống",
        });
      }

      material.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          message: "Mô tả tài liệu không hợp lệ",
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
      .populate("classIds", "name description subject status")
      .populate("createdBy", "name email role");

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

    if (req.user.role === "teacher") {
      if (material.materialType !== "supplementary") {
        return res.status(403).json({
          message: "Giáo viên không được xóa giáo trình chính thức",
        });
      }

      const classResult = await getClassesByIds(material.classIds);

      if (classResult.error) {
        return res.status(classResult.error.status).json({
          message: classResult.error.message,
        });
      }

      if (!teacherOwnsAllClasses(classResult.classes, req.user._id)) {
        return res.status(403).json({
          message: "Bạn không có quyền xóa tài liệu của lớp này",
        });
      }
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
