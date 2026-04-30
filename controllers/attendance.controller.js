const Attendance = require("../models/Attendance.model");
const EmployeeModel = require("../models/Employee.model.js");
const OfficeLocation = require("../models/OfficeLocation.model");
const { getDistanceInMeters } = require("../utils/calcDistance.js");
const { getDaysInMonth } = require("../utils/getDaysInMonth.js");
const { isWorkingDay } = require("../utils/isWorkingDay");

const getWorkingDaysInMonth = (year, month) => {
  const totalDays = new Date(year, month, 0).getDate();
  let workingDays = 0;

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month - 1, d);
    if (isWorkingDay(date)) {
      workingDays++;
    }
  }

  return workingDays;
};

function getWorkingDaysBetween(start, end) {
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();

    // Skip Sunday (0) & Saturday (6)
    if (day !== 0) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

// Mark Attendance
exports.markAttendance = async (req, res) => {
  try {
    const { workMode, latitude, longitude, delayReason, date } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const today = new Date();

    // ❌ Check working day
    if (!isWorkingDay(today)) {
      return res.status(400).json({
        message: "Today is not a working day",
      });
    }

    if (attendanceDate > new Date()) {
      return res.status(400).json({
        message: "Future date attendance not allowed",
      });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (attendanceDate < sevenDaysAgo) {
      return res.status(400).json({
        message: "Cannot mark attendance older than 7 days",
      });
    }

    const existing = await Attendance.findOne({
      employee: req.user.id,
      date: attendanceDate,
    });

    if (existing) {
      return res.status(400).json({
        message: "Attendance already marked",
      });
    }

    let markedLate = false;
    const now = new Date();

    const lateTime = new Date();
    lateTime.setHours(10, 45, 0, 0);

    if (now > lateTime) markedLate = true;

    const attendance = await Attendance.create({
      employee: req.user.id,
      date: attendanceDate,
      checkInTime: new Date(),
      status: "PRESENT",
      workMode,
      delayReason: markedLate ? delayReason || "" : "",
      markedLate,
      delayStatus: markedLate ? "PENDING" : "APPROVED",
      location: workMode === "WFO" ? { latitude, longitude } : {},
    });

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: attendance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * EMPLOYEE: MY ATTENDANCE HISTORY
 */
exports.getMyAttendance = async (req, res) => {
  try {
    const { from, to, month } = req.query;

    const filter = {
      employee: req.user.id,
    };

    // if (month) {
    //   // month = YYYY-MM
    //   filter.date = { $regex: `^${month}` };
    // }

    if (month) {
      // month = YYYY-MM
      const start = new Date(`${month}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      filter.date = {
        $gte: start,
        $lt: end,
      };
    }

    if (from && to) {
      filter.date = { $gte: from, $lte: to };
    }

    const records = await Attendance.find(filter).sort({ date: -1 });

    res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * EMPLOYEE: MONTHLY ATTENDANCE SUMMARY
 */
exports.getMyMonthlySummary = async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month) {
      return res.status(400).json({ message: "Month is required" });
    }

    const [yearStr, monStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const mon = parseInt(monStr, 10);

    if (!year || !mon || mon < 1 || mon > 12) {
      return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
    }

    const monthStart = new Date(year, mon - 1, 1);       // 1st of month, 00:00
    const monthLastDay = new Date(year, mon, 0);           // last day of month
    const totalDays = monthLastDay.getDate();
    const totalWorkingDays = getWorkingDaysInMonth(year, mon);

    // Fetch employee to get verifiedAt
    const employee = await EmployeeModel.findById(req.user.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Effective start: whichever is later — month start or verification date
    const verifiedDate = employee.verifiedAt ? new Date(employee.verifiedAt) : monthStart;
    const rawStart = verifiedDate > monthStart ? verifiedDate : monthStart;

    const actualStart = new Date(rawStart);
    actualStart.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999); // ✅ include the entire day

    const actualEnd = yesterday < monthLastDay ? yesterday : monthLastDay;

    //console.log(actualStart, actualEnd);
    if (actualStart > actualEnd) {
      return res.json({
        success: true,
        data: {
          month,
          totalDays,
          totalWorkingDays,
          workingDays: 0,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          wfhDays: 0,
          wfoDays: 0,
        },
      });
    }

    const records = await Attendance.find({
      employee: req.user.id,
      date: { $gte: actualStart, $lte: actualEnd },
    });

    //console.log(records, actualStart, actualEnd);

    const presentDays = records.length;

    const lateDays = records.filter(
      (r) => r.markedLate && r.delayStatus === "REJECTED" // ← was === "REJECTED", fixed
    ).length;

    const wfhDays = records.filter((r) => r.workMode === "WFH").length;
    const wfoDays = records.filter((r) => r.workMode === "WFO").length;

    const workingDays = getWorkingDaysBetween(actualStart, actualEnd);
    const absentDays = Math.max(workingDays - presentDays, 0);

    return res.json({
      success: true,
      data: {
        month,
        totalDays,
        totalWorkingDays,
        workingDays,
        presentDays,
        absentDays,
        lateDays,
        wfhDays,
        wfoDays,
      },
    });

  } catch (error) {
    console.error("getMyMonthlySummary error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Checkout API
exports.checkOut = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: req.user.id,
      date: today,
    });

    if (!attendance) {
      return res.status(404).json({
        message: "No check-in found for today",
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        message: "Already checked out",
      });
    }

    attendance.checkOutTime = new Date();
    await attendance.save();

    res.json({
      success: true,
      message: "Checked out successfully",
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ADMIN: GET ALL ATTENDANCE
 */
exports.getAllAttendanceAdmin = async (req, res) => {
  try {
    const { date, employeeId, lateOnly } = req.query;

    const filter = {};

    if (date) filter.date = date;
    if (lateOnly === "true") filter.markedLate = true;

    let attendanceQuery = Attendance.find(filter)
      .populate("employee", "employeeId email role")
      .sort({ createdAt: -1 });

    const records = await attendanceQuery;

    let filteredRecords = records;

    if (employeeId) {
      filteredRecords = records.filter(
        (a) => a.employee.employeeId === employeeId,
      );
    }

    res.json({
      success: true,
      count: filteredRecords.length,
      data: filteredRecords,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ADMIN: APPROVE / REJECT DELAY
 */
exports.approveOrRejectDelay = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body missing" });
    }

    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const attendance = await Attendance.findById(req.params.attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    if (!attendance.markedLate) {
      return res.status(400).json({
        message: "This attendance is not marked late",
      });
    }

    attendance.delayStatus = status;
    attendance.adminRemarks = remarks || "";
    attendance.approvedBy = req.user.employeeId;
    attendance.approvedAt = new Date();

    await attendance.save();

    res.json({
      success: true,
      message: `Delay ${status.toLowerCase()} successfully`,
      data: attendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ADMIN: MONTHLY ATTENDANCE SUMMARY (ALL)
 */
exports.getMonthlySummaryAdmin = async (req, res) => {
  try {
    const { month } = req.query; // expected: "YYYY-MM"
    if (!month) {
      return res.status(400).json({ message: "Month is required (YYYY-MM)" });
    }

    const [yearStr, monStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const mon = parseInt(monStr, 10);

    if (!year || !mon || mon < 1 || mon > 12) {
      return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
    }

    const workingDays = getWorkingDaysInMonth(year, mon);

    // Unambiguous date range: start of month → start of next month (exclusive)
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);

    // Fetch all attendance records for the month, with full employee profile
    const records = await Attendance.find({
      date: { $gte: start, $lt: end },
    }).populate("employee");

    // Aggregate per employee
    const summaryMap = {};

    records.forEach((r) => {
      if (!r.employee) return; // guard against orphaned records

      const joinDate = r.employee.verifiedAt ? new Date(r.employee.verifiedAt) : start;
      const effectiveStart = joinDate > start ? joinDate : start;

      const effectiveWorkingDays = getWorkingDaysBetween(effectiveStart, end);

      const empId = r.employee._id.toString();

      if (!summaryMap[empId]) {
        summaryMap[empId] = {
          // Full employee profile
          employee: r.employee,

          // Attendance counters
          presentDays: 0,
          lateDays: 0,
          wfhDays: 0,
          wfoDays: 0,
          workingDays: effectiveWorkingDays,   // ← per-employee, not global

        };
      }

      const entry = summaryMap[empId];
      entry.presentDays += 1;

      if (r.markedLate && r.delayStatus === "REJECTED") entry.lateDays += 1;
      if (r.workMode === "WFH") entry.wfhDays += 1;
      if (r.workMode === "WFO") entry.wfoDays += 1;
    });

    // Build final summary array
    const summary = Object.values(summaryMap).map((emp) => ({
      ...emp,
      absentDays: emp.workingDays - emp.presentDays,
      workingDays: emp.workingDays,
    }));

    // Sort by employeeId for consistent output
    summary.sort((a, b) => (a.employeeId ?? "").localeCompare(b.employeeId ?? ""));

    return res.json({
      success: true,
      month,
      workingDays,
      count: summary.length,
      data: summary,
    });

  } catch (error) {
    console.error("getMonthlySummaryAdmin error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};