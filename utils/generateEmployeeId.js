const Counter = require("../models/Counter.model");

const generateEmployeeId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { key: "EMPLOYEE" },
    { $inc: { value: 1 } },
    { new: true, upsert: true },
  );

  const year = new Date().getFullYear();
  return `EMP${year}${String(counter.value).padStart(4, "0")}`;
};

module.exports = generateEmployeeId;
