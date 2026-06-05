const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema({
  code: String,
  name: String,
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
  },
});

module.exports = mongoose.model("Department", DepartmentSchema);