const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },

    checkInTime: Date,

    workMode: {
      type: String,
      enum: ["WFO", "WFH"],
      required: true,
    },

    location: {
      latitude: Number,
      longitude: Number,
      distanceFromOffice: Number, // meters
    },

    delayReason: {
      type: String,
    },

    delayStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    markedLate: {
      type: Boolean,
      default: false,
    },

    markedByEmployee: {
      type: Boolean,
      default: true,
    },

    approvedBy: {
      type: String, // ADMIN employeeId
    },
    approvedAt: {
      type: Date,
    },
    adminRemarks: {
      type: String,
    },
  },
  { timestamps: true },
);

// Prevent duplicate attendance for same day
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
