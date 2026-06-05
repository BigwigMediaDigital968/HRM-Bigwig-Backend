const mongoose = require("mongoose");

const DesignationSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
    }, // SDE1, SDE2, TL, HRM

    title: {
      type: String,
      required: true,
    }, // Software Engineer

    level: {
      type: Number,
      required: true,
    },

    department: {
      type: String,
      required: true,
    },

    parentDesignation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Designation", DesignationSchema);