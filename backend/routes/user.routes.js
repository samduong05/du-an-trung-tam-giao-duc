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

router.post(
  "/",
  authentication,
  authorizeRoles("admin", "teacher"),
  createUser,
);

router.get("/", authentication, authorizeRoles("admin", "teacher"), getUsers);

router.get(
  "/:id",
  authentication,
  authorizeRoles("admin", "teacher"),
  getUserById,
);

router.put(
  "/:id",
  authentication,
  authorizeRoles("admin", "teacher"),
  updateUser,
);

router.delete(
  "/:id",
  authentication,
  authorizeRoles("admin", "teacher"),
  deleteUser,
);

module.exports = router;
