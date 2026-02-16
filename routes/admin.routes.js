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

module.exports = router;
