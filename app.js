const express = require("express");
const cors = require("cors");

const adminRoutes = require("./routes/admin.routes");
const authRoutes = require("./routes/auth.routes");
const employeeRoutes = require("./routes/employee.routes");
const leaveRoutes = require("./routes/leave.routes.js");
const officeLocationRoutes = require("./routes/officeLocation.routes");
const markAttendanceRoutes = require("./routes/attendance.routes.js");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/office-location", officeLocationRoutes);
app.use("/api/attendance", markAttendanceRoutes);

app.get("/", (req, res) => {
  res.send("Server is Live");
});

module.exports = app;
