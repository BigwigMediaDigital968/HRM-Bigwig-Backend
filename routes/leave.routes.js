const express = require("express");
const router = express.Router();

const {
  requestLeave,
  getMyLeaves,
  getLeaveBalance,
  getAllLeaveRequests,
  approveOrRejectLeave,
  requestLeaveCancellation,
  approveLeaveCancellation,
} = require("../controllers/leave.controller");

const { protect, adminOnly } = require("../middleware/auth.middleware");

// console.log({
//   requestLeave,
//   getMyLeaves,
//   getLeaveBalance,
//   getAllLeaveRequests,
//   approveOrRejectLeave,
// });

// Employee routes
router.post("/request", protect, requestLeave);
router.get("/my", protect, getMyLeaves);
router.get("/balance", protect, getLeaveBalance);
router.put("/:leaveId/cancel-request", protect, requestLeaveCancellation);

// Admin routes
router.get("/admin/all", protect, adminOnly, getAllLeaveRequests);
router.put("/admin/:leaveId/action", protect, adminOnly, approveOrRejectLeave);
router.put(
  "/admin/:leaveId/cancel-approve",
  protect,
  adminOnly,
  approveLeaveCancellation,
);
module.exports = router;
