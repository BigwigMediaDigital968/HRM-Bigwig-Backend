const Joi = require("joi");

exports.employeeDetailsSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  contact: Joi.string().min(10).max(15).required(),
});
