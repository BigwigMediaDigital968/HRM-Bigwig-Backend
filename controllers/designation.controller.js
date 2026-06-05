// controllers/designation.controller.js

const Designation = require("../models/Designation.model");


exports.createDesignation = async (req, res) => {
  try {
    const { code, title, level, department, parentDesignation } = req.body;

    const exists = await Designation.findOne({ code }); // was checking title+department
    if (exists) {
      return res.status(400).json({ success: false, message: "Designation code already exists" });
    }

    const designation = await Designation.create({ code, title, level, department, parentDesignation });
    return res.status(201).json({ success: true, data: designation });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getDesignations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";
    if (req.query.department) filter.department = req.query.department;

    const designations = await Designation.find(filter)
      .populate("parentDesignation", "code title level")
      .sort({ level: 1, createdAt: -1 });

    return res.status(200).json({ success: true, data: designations });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getDesignationById = async (req, res) => {
  try {
    const designation = await Designation.findById(req.params.id)
      .populate("parentDesignation", "code title level"); // was populating "department"
    if (!designation) {
      return res.status(404).json({ success: false, message: "Designation not found" });
    }
    return res.status(200).json({ success: true, data: designation });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateDesignation = async (req, res) => {
  try {
    const designation = await Designation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("parentDesignation", "code title level"); // was populating "department"
    if (!designation) {
      return res.status(404).json({ success: false, message: "Designation not found" });
    }
    return res.status(200).json({ success: true, data: designation });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteDesignation = async (req, res) => {
  try {
    const designation = await Designation.findByIdAndDelete(req.params.id);

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Designation deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};