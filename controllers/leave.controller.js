const LeaveRequest = require("../models/LeaveRequest.model");
const accrueLeaves = require("../utils/accrueLeaves");
const LeaveBalance = require("../models/LeaveBalance.model");

// Request Leave API
exports.requestLeave = async (req, res) => {
  try {
    const { fromDate, toDate, reason } = req.body;
    const employeeId = req.user.id;

    const days =
      (new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24) + 1;

    if (days <= 0) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    await accrueLeaves(employeeId); // still accrue monthly

    const leave = await LeaveRequest.create({
      employee: employeeId,
      fromDate,
      toDate,
      totalDays: days,
      reason,
    });

    res.status(201).json({
      success: true,
      message: "Leave request submitted for admin approval",
      data: leave,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Employee View Own Leaves
exports.getMyLeaves = async (req, res) => {
  const leaves = await LeaveRequest.find({
    employee: req.user.id,
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: leaves,
  });
};

// Employee Leave Balance (Dashboard)
exports.getLeaveBalance = async (req, res) => {
  const balance = await accrueLeaves(req.user.id);

  res.json({
    success: true,
    data: balance,
  });
};

// Admin View All Leave Requests
exports.getAllLeaveRequests = async (req, res) => {
  const leaves = await LeaveRequest.find()
    .populate("employee", "employeeId email role")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: leaves,
  });
};

// Admin Approve / Reject Leave
exports.approveOrRejectLeave = async (req, res) => {
  const { leaveId } = req.params;
  const { status, remarks } = req.body;

  const leave = await LeaveRequest.findById(leaveId);
  if (!leave) return res.status(404).json({ message: "Leave not found" });

  if (leave.status !== "PENDING") {
    return res.status(400).json({ message: "Leave already processed" });
  }

  if (status === "APPROVED") {
    const balance = await LeaveBalance.findOne({ employee: leave.employee });

    balance.usedLeaves += leave.totalDays;
    balance.availableLeaves -= leave.totalDays;

    // Optional tracking for LWP
    if (balance.availableLeaves < 0) {
      balance.negativeLeaves = Math.abs(balance.availableLeaves);
    }

    await balance.save();
  }

  leave.status = status;
  leave.adminRemarks = remarks;
  leave.actionBy = req.user.employeeId;
  leave.actionAt = new Date();
  await leave.save();

  res.json({
    success: true,
    message: `Leave ${status.toLowerCase()} successfully`,
  });
};

// Employee Requests Leave Cancellation
exports.requestLeaveCancellation = async (req, res) => {
  const { leaveId } = req.params;

  const leave = await LeaveRequest.findById(leaveId);
  if (!leave) {
    return res.status(404).json({ message: "Leave not found" });
  }

  if (leave.employee.toString() !== req.user.id) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (leave.status !== "APPROVED") {
    return res.status(400).json({
      message: "Only approved leaves can be cancelled",
    });
  }

  if (leave.cancellationStatus !== "NONE") {
    return res.status(400).json({
      message: "Cancellation already requested",
    });
  }

  leave.cancellationStatus = "REQUESTED";
  await leave.save();

  res.json({
    success: true,
    message: "Leave cancellation requested",
  });
};

// Admin Approves Leave Cancellation (REVERSAL)
exports.approveLeaveCancellation = async (req, res) => {
  try {
    const { leaveId } = req.params;

    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // Must be approved leave
    if (leave.status !== "APPROVED") {
      return res.status(400).json({
        message: "Only approved leaves can be cancelled",
      });
    }

    // Prevent double reversal
    if (leave.cancellationStatus === "APPROVED") {
      return res.status(400).json({
        message: "Leave already cancelled",
      });
    }

    if (leave.cancellationStatus !== "REQUESTED") {
      return res.status(400).json({
        message: "No cancellation request found",
      });
    }

    const balance = await LeaveBalance.findOne({
      employee: leave.employee,
    });

    if (!balance) {
      return res.status(404).json({ message: "Leave balance not found" });
    }

    // Restore used leaves safely
    balance.usedLeaves = Math.max(0, balance.usedLeaves - leave.totalDays);

    // Recalculate from source of truth
    balance.availableLeaves = balance.totalLeaves - balance.usedLeaves;

    // Handle negative recovery
    balance.negativeLeaves = Math.max(0, -balance.availableLeaves);

    await balance.save();

    leave.status = "CANCELLED";
    leave.cancellationStatus = "APPROVED";
    leave.cancelledAt = new Date();
    leave.cancelledBy = req.user.employeeId;

    await leave.save();

    return res.json({
      success: true,
      message: "Leave cancelled and balance restored successfully",
      data: {
        usedLeaves: balance.usedLeaves,
        availableLeaves: balance.availableLeaves,
        negativeLeaves: balance.negativeLeaves,
      },
    });
  } catch (error) {
    console.error("Leave cancellation approval error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
