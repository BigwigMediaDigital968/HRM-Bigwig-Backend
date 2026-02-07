const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload.middleware");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");
const { submitEmployeeDetails } = require("../controllers/employee.controller");
const { employeeDetailsSchema } = require("../validations/employee.validation");

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
  submitEmployeeDetails,
);

module.exports = router;
