const express = require("express");
const router = express.Router();

const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  verifyOrRejectEmployee,
  toggleEmployeeStatus,
} = require("../controllers/admin.controller");
const { createEmployeeSchema } = require("../validations/admin.validation");
const { protect, adminOnly } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");
const { updateEmployeePassword } = require("../controllers/auth.controller");
const departmentRoutes = require("./department.routes");
const designationRoutes = require("./designation.routes");
const { updateEmployeeAssignment } = require("../controllers/employee.controller");

console.log("Admin routes loaded");
router.use("/departments", protect,
  allowRoles("ADMIN"), departmentRoutes);
router.use("/designations", protect,
  allowRoles("ADMIN"), designationRoutes);

router.post(
  "/create-employee",
  protect,
  allowRoles("ADMIN"),
  async (req, res, next) => {
    const { error } = createEmployeeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  },
  createEmployee,
);

// Get all employees
router.get("/employees", protect, allowRoles("ADMIN"), getAllEmployees);

// Get single employee
router.get(
  "/employee/:employeeId",
  protect,
  allowRoles("ADMIN"),
  getEmployeeById,
);

router.put(
  "/employee/:employeeId/verify",
  protect,
  adminOnly,
  verifyOrRejectEmployee,
);

router.put(
  "/employee/:employeeId/toggle-status",
  protect,
  adminOnly,
  toggleEmployeeStatus,
);

router.put(
  "/employee/:employeeId/update-password",
  protect,
  adminOnly,
  updateEmployeePassword,
);

router.put(
  "/employee/:employeeId/assignment",
  protect,
  allowRoles("ADMIN"),
  updateEmployeeAssignment
);

module.exports = router;
