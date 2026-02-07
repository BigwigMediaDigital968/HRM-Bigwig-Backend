const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee.model");
const { generateToken } = require("../utils/jwt");

exports.login = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    /* --------------------------------------------------
       HARD-CODED ADMIN LOGIN (DEV ONLY)
    -------------------------------------------------- */
    if (employeeId === "ADMIN001" && password === "bigwig@2026") {
      const token = generateToken({
        id: "ADMIN_ID",
        role: "ADMIN",
        employeeId: "ADMIN001",
      });

      return res.status(200).json({
        success: true,
        data: {
          token,
          employee: {
            employeeId: "ADMIN001",
            email: "admin@bigwig.com",
            role: "ADMIN",
            verificationStatus: "APPROVED",
          },
        },
      });
    }

    /* --------------------------------------------------
       NORMAL EMPLOYEE LOGIN
    -------------------------------------------------- */
    const employee = await Employee.findOne({ employeeId });
    if (!employee || !employee.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({
      id: employee._id,
      role: employee.role,
      employeeId: employee.employeeId,
    });

    return res.status(200).json({
      success: true,
      data: {
        token,
        employee: {
          employeeId: employee.employeeId,
          email: employee.email,
          role: employee.role,
          verificationStatus: employee.verificationStatus,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
