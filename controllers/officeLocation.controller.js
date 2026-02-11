const OfficeLocation = require("../models/OfficeLocation.model");

/**
 * CREATE OFFICE LOCATION
 */
exports.createOfficeLocation = async (req, res) => {
  try {
    const { name, latitude, longitude, radiusInMeters } = req.body;

    if (!name || !latitude || !longitude) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const location = await OfficeLocation.create({
      name,
      latitude,
      longitude,
      radiusInMeters,
      createdBy: req.user.employeeId,
    });

    res.status(201).json({
      success: true,
      message: "Office location created",
      data: location,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET ALL OFFICE LOCATIONS
 */
exports.getOfficeLocations = async (req, res) => {
  try {
    const locations = await OfficeLocation.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: locations.length,
      data: locations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE OFFICE LOCATION
 */
exports.updateOfficeLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await OfficeLocation.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Office location not found" });
    }

    res.json({
      success: true,
      message: "Office location updated",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE OFFICE LOCATION
 */
exports.deleteOfficeLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await OfficeLocation.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Office location not found" });
    }

    res.json({
      success: true,
      message: "Office location deleted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
