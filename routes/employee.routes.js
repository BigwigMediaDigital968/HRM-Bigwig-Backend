const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload.middleware");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");
const {
  submitEmployeeDetails,
  getMyEmployeeDetails,
} = require("../controllers/employee.controller");
const { employeeDetailsSchema } = require("../validations/employee.validation");

/**
 * Submit / Update employee details
 */
router.put(
  "/details",
  protect,
  allowRoles("EMPLOYEE"),
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
  ]),
  (req, res, next) => {
    const { error } = employeeDetailsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  },
  submitEmployeeDetails
);

/**
 * ✅ Get logged-in employee's own details
 */
router.get(
  "/details/me",
  protect,
  allowRoles("EMPLOYEE"),
  getMyEmployeeDetails
);

module.exports = router;
