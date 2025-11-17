const Joi = require("joi");

const adminSchemas = {
  create: Joi.object().keys({
    name: Joi.string().trim().optional(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).optional(), // enforce minimum password length
    role: Joi.string().optional(), // matches Prisma Int
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    country: Joi.string().optional(),
    state: Joi.string().optional(),
    city: Joi.string().optional(),
    user_type: Joi.string().optional(),
    status: Joi.number().optional(),
    is_password_reset_required: Joi.boolean().optional(),
  }),
};

module.exports = adminSchemas;
