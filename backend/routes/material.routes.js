const express = require("express");

const {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
} = require("../controllers/material.controller");

const {
  authentication,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const { requireMongoConnection } = require("../middlewares/mongo.middleware");

const router = express.Router();

router.get(
  "/",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin", "teacher", "student"),
  getMaterials,
);

router.get(
  "/:id",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin", "teacher", "student"),
  getMaterialById,
);

router.post(
  "/",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin", "teacher"),
  createMaterial,
);

router.put(
  "/:id",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin", "teacher"),
  updateMaterial,
);

router.delete(
  "/:id",
  requireMongoConnection,
  authentication,
  authorizeRoles("admin", "teacher"),
  deleteMaterial,
);

module.exports = router;
