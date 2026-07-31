const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      trim: true,
      default: "",
    },

    size: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
  },
);

const linkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const materialSchema = new mongoose.Schema(
  {
    classIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
        },
      ],
      required: true,
      validate: {
        validator: (classIds) =>
          Array.isArray(classIds) && classIds.length > 0,
        message: "Tài liệu phải thuộc ít nhất một lớp học",
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    materialType: {
      type: String,
      enum: ["curriculum", "supplementary"],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    files: {
      type: [fileSchema],
      default: [],
    },

    links: {
      type: [linkSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["published", "hidden"],
      default: "published",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

materialSchema.index({
  classIds: 1,
  materialType: 1,
  status: 1,
  createdAt: -1,
});

materialSchema.index({
  createdBy: 1,
  materialType: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Material", materialSchema);