const express = require("express");
const router = express.Router();
const { login } = require("../controllers/auth.controller");
const { loginSchema } = require("../validations/auth.validation");

router.post(
  "/login",
  async (req, res, next) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  },
  login,
);

module.exports = router;
