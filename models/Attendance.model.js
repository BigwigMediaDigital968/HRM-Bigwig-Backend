const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    checkInTime: {
      type: Date,
    },

    checkOutTime: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["PRESENT", "ABSENT"],
      default: "PRESENT",
    },

    workMode: {
      type: String,
      enum: ["WFO", "WFH"],
    },

    location: {
      latitude: Number,
      longitude: Number,
      distanceFromOffice: Number,
    },

    delayReason: String,

    delayStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    markedLate: {
      type: Boolean,
      default: false,
    },

    approvedBy: String,
    approvedAt: Date,
    adminRemarks: String,
  },
  { timestamps: true },
);

// Prevent duplicate attendance per day
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
