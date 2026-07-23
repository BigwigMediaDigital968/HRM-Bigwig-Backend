const express = require("express");
const router = express.Router();

const {
  markAttendance,
  getAllAttendanceAdmin,
  approveOrRejectDelay,
  approveOrRejectEarlyCheckout,
  getMyAttendance,
  getMyMonthlySummary,
  getMonthlySummaryAdmin,
  checkOut,
  previewAttendance,
  exportAttendance,
} = require("../controllers/attendance.controller.js");
const { protect, adminOnly } = require("../middleware/auth.middleware.js");

// Employee
router.post("/mark", protect, markAttendance);
router.get("/my-attendance", protect, getMyAttendance);
router.get("/my-attendance/summary", protect, getMyMonthlySummary);
router.post("/checkout", protect, checkOut);

// Admin
router.get("/admin/all", protect, adminOnly, getAllAttendanceAdmin);
router.put(
  "/admin/:attendanceId/delay-action",
  protect,
  adminOnly,
  approveOrRejectDelay,
);

router.put(
  "/admin/:attendanceId/early-checkout-action",
  protect,
  adminOnly,
  approveOrRejectEarlyCheckout,
);

router.get(
  "/admin/attnadance-summary",
  protect,
  adminOnly,
  getMonthlySummaryAdmin,
);

router.get(
  "/export/preview",
  protect,
  adminOnly,
  previewAttendance
);
 
/**
 * GET /api/attendance/export
 * Same query params as preview.
 * Streams an .xlsx file as a download.
 */

module.exports = router;
