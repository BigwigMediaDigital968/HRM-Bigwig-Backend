// models/OfficeLocation.model.js
const mongoose = require("mongoose");

const OfficeLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // "Head Office", "Branch A"
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    radiusInMeters: {
      type: Number,
      default: 100, // allowed radius
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String, // ADMIN employeeId
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("OfficeLocation", OfficeLocationSchema);
