const mongoose = require("mongoose");

const LeaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
    },
    totalLeaves: {
      type: Number,
      default: 0,
    },
    usedLeaves: {
      type: Number,
      default: 0,
    },
    availableLeaves: {
      type: Number,
      default: 0,
    },
    negativeLeaves: {
      type: Number,
      default: 0,
    },
    lastAccruedMonth: {
      type: String, // "2026-02"
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LeaveBalance", LeaveBalanceSchema);
