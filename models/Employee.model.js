const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["EMPLOYEE", "HR", "MANAGER", "ADMIN"],
      default: "EMPLOYEE",
    },

    verificationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    isActive: { type: Boolean, default: true },

    deactivetedAt: {
      type: Date,
    },

    deactivetedBy: {
      type: String, // ADMIN employeeId
    },

    verificationRemarks: {
      type: String,
      default: "",
    },
    verifiedBy: {
      type: String, // ADMIN employeeId
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Employee", EmployeeSchema);
