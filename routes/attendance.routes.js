const express = require("express");
const router = express.Router();

const {
  markAttendance,
  getAllAttendanceAdmin,
  approveOrRejectDelay,
  getMyAttendance,
  getMyMonthlySummary,
  getMonthlySummaryAdmin,
} = require("../controllers/attendance.controller.js");
const { protect, adminOnly } = require("../middleware/auth.middleware.js");

// Employee
router.post("/mark", protect, markAttendance);
router.get("/my-attendance", protect, getMyAttendance);
router.get("/my-attendance/summary", protect, getMyMonthlySummary);

// Admin
router.get("/admin/all", protect, adminOnly, getAllAttendanceAdmin);
router.put(
  "/admin/:attendanceId/delay-action",
  protect,
  adminOnly,
  approveOrRejectDelay,
);

router.get(
  "/admin/attnadance-summary",
  protect,
  adminOnly,
  getMonthlySummaryAdmin,
);

module.exports = router;
