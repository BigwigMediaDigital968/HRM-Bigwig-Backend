const LeaveBalance = require("../models/LeaveBalance.model");

module.exports = async (employeeId) => {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  let balance = await LeaveBalance.findOne({ employee: employeeId });

  if (!balance) {
    return await LeaveBalance.create({
      employee: employeeId,
      totalLeaves: 1,
      availableLeaves: 1,
      lastAccruedMonth: currentMonth,
    });
  }

  if (balance.lastAccruedMonth !== currentMonth) {
    balance.totalLeaves += 1;
    balance.availableLeaves += 1;
    balance.lastAccruedMonth = currentMonth;
    await balance.save();
  }

  return balance;
};
