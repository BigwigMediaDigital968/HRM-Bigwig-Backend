const mongoose = require("mongoose");

const LeaveRequestSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    cancellationStatus: {
      type: String,
      enum: ["NONE", "REQUESTED", "APPROVED"],
      default: "NONE",
    },
    cancelledAt: Date,
    cancelledBy: String,
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING",
    },
    adminRemarks: String,
    actionBy: String,
    actionAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("LeaveRequest", LeaveRequestSchema);
