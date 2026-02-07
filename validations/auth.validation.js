const Joi = require("joi");

exports.loginSchema = Joi.object({
  employeeId: Joi.string().required(),
  password: Joi.string().required(),
});
