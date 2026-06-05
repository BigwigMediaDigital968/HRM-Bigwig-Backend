// routes/department.routes.js

const express = require("express");
const router = express.Router();

const { createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment, } = require("../controllers/department.controller");

router.post("/", createDepartment);
router.get("/", getDepartments);
router.get("/:id", getDepartmentById);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

module.exports = router;