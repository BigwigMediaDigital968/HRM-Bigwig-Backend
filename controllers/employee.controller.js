const Employee = require("../models/Employee.model");
const EmployeeDetails = require("../models/EmployeeDetails.model");

/**
 * Submit / Update Employee Details
 */
exports.submitEmployeeDetails = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (employee.verificationStatus === "APPROVED") {
      return res.status(403).json({
        message: "Details already verified. Contact admin for changes.",
      });
    }

    const detailsPayload = {
      employee: employeeId,
      name: req.body.name,
      email: req.body.email,
      contact: req.body.contact,
    };

    if (req.files?.photo) {
      detailsPayload.photo = {
        url: req.files.photo[0].path,
        publicId: req.files.photo[0].filename,
      };
    }

    if (req.files?.aadhaar) {
      detailsPayload.aadhaar = {
        url: req.files.aadhaar[0].path,
        publicId: req.files.aadhaar[0].filename,
      };
    }

    if (req.files?.pan) {
      detailsPayload.pan = {
        url: req.files.pan[0].path,
        publicId: req.files.pan[0].filename,
      };
    }

    const details = await EmployeeDetails.findOneAndUpdate(
      { employee: employeeId },
      detailsPayload,
      { upsert: true, new: true }
    );

    employee.verificationStatus = "PENDING";
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee details submitted successfully",
      data: details,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Get Logged-in Employee's Own Details
 */
exports.getMyEmployeeDetails = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const details = await EmployeeDetails.findOne({
      employee: employeeId,
    }).populate("employee", "email role verificationStatus");

    if (!details) {
      return res.status(404).json({
        message: "Employee details not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
