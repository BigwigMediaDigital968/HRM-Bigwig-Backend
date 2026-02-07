const Joi = require("joi");

exports.createEmployeeSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid("EMPLOYEE", "HR", "MANAGER").required(),
});
