const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee.model");
const generateEmployeeId = require("../utils/generateEmployeeId");
const generatePassword = require("../utils/generatePassword");
const EmployeeDetails = require("../models/EmployeeDetails.model");

// Creating new employee
exports.createEmployee = async (req, res) => {
  try {
    const { email, role } = req.body;

    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Employee already exists" });
    }

    const employeeId = await generateEmployeeId();
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const employee = await Employee.create({
      employeeId,
      email,
      password: hashedPassword,
      role,
    });

    return res.status(201).json({
      success: true,
      data: {
        employeeId: employee.employeeId,
        email: employee.email,
        role: employee.role,
        temporaryPassword: plainPassword,
        portalUrl: "https://company.com/employee-login",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET ALL EMPLOYEES WITH DETAILS
 */
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select("-password").lean();

    const employeeIds = employees.map((emp) => emp._id);

    const details = await EmployeeDetails.find({
      employee: { $in: employeeIds },
    }).lean();

    // Merge employee + details
    const employeeMap = {};
    details.forEach((d) => {
      employeeMap[d.employee.toString()] = d;
    });

    const response = employees.map((emp) => ({
      ...emp,
      employeeDetails: employeeMap[emp._id.toString()] || null,
    }));

    res.status(200).json({
      success: true,
      count: response.length,
      data: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET SINGLE EMPLOYEE WITH DETAILS
 */
exports.getEmployeeById = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findOne({ employeeId }).select("-password");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const details = await EmployeeDetails.findOne({
      employee: employee._id,
    });

    res.status(200).json({
      success: true,
      data: {
        ...employee.toObject(),
        employeeDetails: details || null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify Employee Status
exports.verifyOrRejectEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, remarks } = req.body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.verificationStatus = status;
    employee.verificationRemarks = remarks || "";
    employee.verifiedBy = req.user.employeeId;
    employee.verifiedAt = new Date();

    await employee.save();

    return res.status(200).json({
      success: true,
      message: `Employee ${status.toLowerCase()} successfully`,
      data: {
        employeeId: employee.employeeId,
        verificationStatus: employee.verificationStatus,
        verificationRemarks: employee.verificationRemarks,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE (Deactivate) Employee
exports.deactiveteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Prevent deleting admin
    if (employee.role === "ADMIN") {
      return res
        .status(403)
        .json({ message: "Admin account cannot be deleted" });
    }

    // Already inactive
    if (!employee.isActive) {
      return res.status(400).json({ message: "Employee already inactive" });
    }

    employee.isActive = false;
    employee.deactivetedAt = new Date();
    employee.deactivetedBy = req.user.employeeId;

    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee deactivated successfully",
      data: {
        employeeId: employee.employeeId,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
