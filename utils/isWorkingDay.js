// exports.isWorkingDay = (date) => {
//   const day = date.getDay(); // 0 = Sunday, 6 = Saturday

//   // ❌ Sunday
//   if (day === 0) return false;

//   // Saturday logic
//   if (day === 6) {
//     const dayOfMonth = date.getDate();
//     const weekNumber = Math.ceil(dayOfMonth / 7);

//     // ❌ 2nd and 4th Saturday
//     if (weekNumber === 2 || weekNumber === 4) {
//       return false;
//     }
//   }

//   return true;
// };

exports.isWorkingDay = (date) => {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday

  // ❌ Only Sunday is holiday
  if (day === 0) return false;

  // ✅ All other days are working
  return true;
};
