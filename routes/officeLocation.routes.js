const express = require("express");
const router = express.Router();

const {
  createOfficeLocation,
  getOfficeLocations,
  updateOfficeLocation,
  deleteOfficeLocation,
} = require("../controllers/officeLocation.controller.js");

const { protect, adminOnly } = require("../middleware/auth.middleware.js");

router.post("/create", protect, adminOnly, createOfficeLocation);
router.get("/get", protect, adminOnly, getOfficeLocations);
router.put("/update/:id", protect, adminOnly, updateOfficeLocation);
router.delete("/delete/:id", protect, adminOnly, deleteOfficeLocation);

module.exports = router;
