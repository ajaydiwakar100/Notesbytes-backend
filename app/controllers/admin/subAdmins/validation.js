const Joi = require("joi");

const adminSchemas = {
  create: Joi.object().keys({
    name: Joi.string().trim().optional(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).optional(), // enforce minimum password length
    roleId: Joi.number().integer().optional(), // matches Prisma Int
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    country: Joi.string().optional(),
    state: Joi.string().optional(),
    city: Joi.string().optional(),
    user_type: Joi.string().optional(),
    status: Joi.boolean().optional(),
    is_password_reset_required: Joi.boolean().optional(),
  }),
};

module.exports = adminSchemas;
