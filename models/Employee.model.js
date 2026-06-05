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

    deactivatedAt: {
      type: Date,
    },

    deactivatedBy: {
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
    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
    },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    }
  },
  { timestamps: true },
);

EmployeeSchema.virtual("details", {
  ref: "EmployeeDetails",
  localField: "_id",
  foreignField: "employee",
  justOne: true,
});

module.exports = mongoose.model("Employee", EmployeeSchema);
