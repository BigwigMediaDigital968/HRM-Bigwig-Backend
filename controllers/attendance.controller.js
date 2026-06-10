const Attendance = require("../models/Attendance.model");
const EmployeeModel = require("../models/Employee.model.js");
const EmployeeDetails = require("../models/EmployeeDetails.model.js");
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
      return res.status(400).json({
        message: "Date is required",
      });
    }

    // =========================
    // DATE VALIDATION
    // =========================

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const today = new Date();

    // Check working day
    if (!isWorkingDay(today)) {
      return res.status(400).json({
        message: "Today is not a working day",
      });
    }

    // Future date check
    if (attendanceDate > new Date()) {
      return res.status(400).json({
        message: "Future date attendance not allowed",
      });
    }

    // Max 7 days old
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (attendanceDate < sevenDaysAgo) {
      return res.status(400).json({
        message: "Cannot mark attendance older than 7 days",
      });
    }

    // =========================
    // DUPLICATE CHECK
    // =========================

    const existing = await Attendance.findOne({
      employee: req.user.id,
      date: attendanceDate,
    });

    if (existing) {
      return res.status(400).json({
        message: "Attendance already marked",
      });
    }

    // =========================
    // OFFICE LOCATION VALIDATION
    // =========================

    let matchedOffice = null;

    if (workMode === "WFO") {
      if (!latitude || !longitude) {
        return res.status(400).json({
          message: "Location is required for WFO attendance",
        });
      }

      // Fetch all office locations
      const officeLocations = await OfficeLocation.find();

      if (!officeLocations.length) {
        return res.status(400).json({
          message: "No office locations configured",
        });
      }

      // Check if user is inside any office radius
      for (const office of officeLocations) {
        const distance = getDistanceInMeters(
          Number(latitude),
          Number(longitude),
          Number(office.latitude),
          Number(office.longitude),
        );

        if (distance <= office.radiusInMeters) {
          matchedOffice = office;
          break;
        }
      }

      // User outside office area
      if (!matchedOffice) {
        return res.status(403).json({
          success: false,
          message:
            "You are outside the office location radius. Attendance not allowed.",
        });
      }
    }

    // =========================
    // LATE MARKING LOGIC
    // =========================

    let markedLate = false;

    const now = new Date();

    const lateTime = new Date();
    // 10:45 IST = 05:15 UTC
    lateTime.setUTCHours(5, 15, 0, 0);

    if (now > lateTime) {
      markedLate = true;
    }

    // =========================
    // CREATE ATTENDANCE
    // =========================

    const attendance = await Attendance.create({
      employee: req.user.id,
      date: attendanceDate,
      checkInTime: new Date(),
      status: "PRESENT",
      workMode,

      delayReason: markedLate ? delayReason || "" : "",
      markedLate,
      delayStatus: markedLate ? "PENDING" : "APPROVED",

      location:
        workMode === "WFO"
          ? {
              latitude,
              longitude,
              officeId: matchedOffice?._id,
              officeName: matchedOffice?.name,
            }
          : {},
    });

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: attendance,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
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
    // console.log("getMyAttendance filter:", filter);
    // console.log("getMyAttendance records:", records);

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
      return res
        .status(400)
        .json({ message: "Invalid month format. Use YYYY-MM" });
    }

    const monthStart = new Date(Date.UTC(year, mon - 1, 1));
    const monthLastDay = new Date(Date.UTC(year, mon, 0)); // last day of month
    const totalDays = monthLastDay.getUTCDate();
    const totalWorkingDays = getWorkingDaysInMonth(year, mon);

    // Fetch employee to get verifiedAt
    const employee = await EmployeeModel.findById(req.user.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Effective start: whichever is later — month start or verification date
    const verifiedDate = employee.verifiedAt
      ? new Date(employee.verifiedAt)
      : monthStart;
    verifiedDate.setUTCHours(0, 0, 0, 0);
    const rawStart = verifiedDate > monthStart ? verifiedDate : monthStart;

    const actualStart = new Date(rawStart);
    actualStart.setUTCHours(0, 0, 0, 0);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);
    yesterday.setUTCHours(23, 59, 59, 999); // ✅ include the entire day

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
      (r) => r.markedLate && r.delayStatus === "REJECTED", // ← was === "REJECTED", fixed
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
    const { latitude, longitude } = req.body;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const office = await OfficeLocation.findById(attendance.location.officeId);

    console.log(
      "Checkout request for employee:",
      req.user.id,
      "on date:",
      today,
    );

    const distance = getDistanceInMeters(
      Number(latitude),
      Number(longitude),
      Number(office.latitude),
      Number(office.longitude),
    );

    if (distance > office.radiusInMeters) {
      return res.status(403).json({
        success: false,
        message: "Checkout must be done from the same office location.",
      });
    }

    const attendance = await Attendance.findOne({
      employee: req.user.id,
      date: today,
    });

    if (!attendance) {
      // console.log("No attendance record found for checkout:")
      return res.status(404).json({
        message: "No check-in found for today",
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        message: "Already checked out",
      });
    }

    if (attendance.workMode === "WFO") {
      if (!latitude || !longitude) {
        return res.status(400).json({
          message: "Location is required for checkout",
        });
      }

      const officeLocations = await OfficeLocation.find();

      if (!officeLocations.length) {
        return res.status(400).json({
          message: "No office locations configured",
        });
      }

      let insideOffice = false;

      for (const office of officeLocations) {
        const distance = getDistanceInMeters(
          Number(latitude),
          Number(longitude),
          Number(office.latitude),
          Number(office.longitude),
        );

        if (distance <= office.radiusInMeters) {
          insideOffice = true;
          break;
        }
      }

      if (!insideOffice) {
        return res.status(403).json({
          success: false,
          message:
            "You are outside the office location radius. Checkout not allowed.",
        });
      }
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
    const now = new Date();

    if (!year || !mon || mon < 1 || mon > 12) {
      return res
        .status(400)
        .json({ message: "Invalid month format. Use YYYY-MM" });
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

      const joinDate = r.employee.verifiedAt
        ? new Date(r.employee.verifiedAt)
        : start;
      const effectiveStart = joinDate > start ? joinDate : start;

      const effectiveEnd = new Date(Math.min(end.getTime(), now.getTime()));
      effectiveEnd.setUTCHours(0, 0, 0, 0);

      const effectiveWorkingDays = getWorkingDaysBetween(
        effectiveStart,
        effectiveEnd,
      );

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
          workingDays: effectiveWorkingDays, // ← per-employee, not global
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
    summary.sort((a, b) =>
      (a.employeeId ?? "").localeCompare(b.employeeId ?? ""),
    );

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

const toIST = (date) => {
  if (!date) return null;
  const d = new Date(date);
  // UTC+5:30
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset() + 330);
  return d;
};

const fmtTime = (date) => {
  const d = toIST(date);
  if (!d) return "—";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const fmtDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const minsWorked = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return null;
  return Math.round((new Date(checkOut) - new Date(checkIn)) / 60000);
};

const fmtHours = (mins) => {
  if (mins === null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

// ─── Preview endpoint (returns JSON for the modal preview) ───────────────────

/**
 * Count Mon–Fri working days between two UTC-zeroed dates, inclusive.
 */

exports.previewAttendance = async (req, res) => {
  try {
    const { employeeId = "all", from, to } = req.query;

    const now = new Date();
    const start = from
      ? new Date(from)
      : new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const end = to
      ? new Date(to)
      : new Date(
          Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        );

    const effectiveEnd = new Date(Math.min(end.getTime(), now.getTime()));
    effectiveEnd.setUTCHours(0, 0, 0, 0);

    // ── 1. Scope filter ───────────────────────────────────────────────────────
    const attendanceQuery = { date: { $gte: start, $lte: effectiveEnd } };

    if (employeeId !== "all") {
      const emp = await EmployeeModel.findOne({ employeeId }).lean();
      if (!emp) {
        return res
          .status(404)
          .json({ success: false, message: "Employee not found" });
      }
      attendanceQuery.employee = emp._id;
    }

    // ── 2. Fetch attendance records (only PRESENT records exist in DB) ────────
    const records = await Attendance.find(attendanceQuery)
      .populate("employee", "employeeId email createdAt") // createdAt = join date
      .sort({ date: 1 })
      .lean();

    // ── 3. Batch-fetch EmployeeDetails — fix N+1 ─────────────────────────────
    const uniqueObjectIds = [
      ...new Map(
        records
          .filter((r) => r.employee?._id)
          .map((r) => [r.employee._id.toString(), r.employee._id]),
      ).values(),
    ];

    const detailsList = await EmployeeDetails.find({
      employee: { $in: uniqueObjectIds },
    }).lean();

    // objectId string → details
    const detailsMap = {};
    detailsList.forEach((d) => {
      detailsMap[d.employee.toString()] = d;
    });

    // ── 4. Build per-employee summary ─────────────────────────────────────────
    //
    // CORE FIX: No ABSENT records exist in DB.
    // Absent = workingDays(effectiveStart → rangeEnd) − presentDays
    //
    // Edge case — mid-month joiner:
    // effectiveStart = max(rangeStart, employeeJoinDate)
    // So a joiner on the 15th only has working days counted from the 15th.
    //
    const empMap = {};

    records.forEach((r) => {
      const eid = r.employee?.employeeId || "unknown";
      const oidStr = r.employee?._id?.toString();

      if (!empMap[eid]) {
        const details = oidStr ? detailsMap[oidStr] : null;

        // Join date: use employee account createdAt as proxy.
        // If your EmployeeDetails has a separate joiningDate field, prefer that.
        const joinDate = details?.joiningDate
          ? new Date(details.joiningDate)
          : r.employee?.createdAt
            ? new Date(r.employee.createdAt)
            : start;

        // Effective start = later of range start or join date (mid-month joiner fix)
        const effectiveStart = new Date(
          Math.max(start.getTime(), joinDate.setUTCHours(0, 0, 0, 0)),
        );

        const rangeEnd = new Date(effectiveEnd);
        rangeEnd.setUTCHours(0, 0, 0, 0);

        empMap[eid] = {
          employeeId: eid,
          name: details?.name || "—",
          email: r.employee?.email || "—",
          workingDays: getWorkingDaysBetween(effectiveStart, rangeEnd),
          presentDays: 0,
          lateDays: 0,
          wfoDays: 0,
          wfhDays: 0,
        };
      }

      // Every record in DB is PRESENT — no need to check r.status
      empMap[eid].presentDays++;
      if (r.markedLate && r.delayStatus == "REJECTED") empMap[eid].lateDays++;
      if (r.workMode === "WFO") empMap[eid].wfoDays++;
      if (r.workMode === "WFH") empMap[eid].wfhDays++;
    });

    // ── 5. Derive absentDays & attendance % ──────────────────────────────────
    const summary = Object.values(empMap).map((e) => {
      // Safety cap: can't be present more days than working days
      const present = Math.min(e.presentDays, e.workingDays);
      const absent = Math.max(0, e.workingDays - present);
      const pct =
        e.workingDays > 0 ? Math.round((present / e.workingDays) * 100) : 0;

      return {
        employeeId: e.employeeId,
        name: e.name,
        email: e.email,
        totalDays: e.workingDays, // working days they were expected to attend
        presentDays: present,
        absentDays: absent,
        lateDays: e.lateDays,
        wfoDays: e.wfoDays,
        wfhDays: e.wfhDays,
        attendancePct: pct,
      };
    });

    // ── 6. Daily log — full data, no slice ───────────────────────────────────
    const dailyLog = records.map((r) => {
      const oidStr = r.employee?._id?.toString();
      const details = oidStr ? detailsMap[oidStr] : null;
      return {
        employeeId: r.employee?.employeeId || "—",
        name: details?.name || "—",
        date: fmtDate(r.date),
        status: r.markedLate && r.delayStatus == "REJECTED" ? "LATE" : r.status,
        workMode: r.workMode || "—",
        checkIn: fmtTime(r.checkInTime),
        checkOut: fmtTime(r.checkOutTime),
        hoursWorked: fmtHours(minsWorked(r.checkInTime, r.checkOutTime)),
        markedLate: r.markedLate,
        delayStatus: r.delayStatus || "—",
      };
    });

    return res.json({
      success: true,
      data: {
        summary,
        dailyPreview: dailyLog,
        totalRecords: records.length,
        dateRange: { from: start, to: end },
      },
    });
  } catch (err) {
    console.error("Preview error:", err);
    return res.status(500).json({ success: false, message: "Preview failed" });
  }
};

// ─── Controller ───────────────────────────────────────────────────────────────
