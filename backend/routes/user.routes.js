const express = require("express");

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");

const {
  authentication,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();

// Admin tạo teacher/student.
// Teacher chỉ tạo student.
router.post(
  "/",
  authentication,
  authorizeRoles("admin", "teacher"),
  createUser,
);

// Chỉ admin được quản lý tài khoản.
router.get("/", authentication, authorizeRoles("admin"), getUsers);

router.get("/:id", authentication, authorizeRoles("admin"), getUserById);

router.put("/:id", authentication, authorizeRoles("admin"), updateUser);

router.delete("/:id", authentication, authorizeRoles("admin"), deleteUser);

module.exports = router;
