const mongoose = require("mongoose");

const EmployeeDetailsSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      unique: true,
    },

    name: String,
    email: String,
    contact: String,

    photo: {
      url: String,
      publicId: String,
    },

    aadhaar: {
      url: String,
      publicId: String,
    },

    pan: {
      url: String,
      publicId: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("EmployeeDetails", EmployeeDetailsSchema);
