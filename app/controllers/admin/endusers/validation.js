const Joi = require("joi");

const endUserSchemas = {
  create: Joi.object().keys({
    name: Joi.string().trim().required(),
    email: Joi.string().email().required(),

    phone: Joi.string()
      .pattern(/^[0-9]{7,15}$/)
      .required(),

    address: Joi.string().allow("", null).optional(),
    country: Joi.string().allow("", null).optional(),
    state: Joi.string().allow("", null).optional(),
    city: Joi.string().allow("", null).optional(),

    pincode: Joi.string()
      .pattern(/^[0-9]{4,10}$/)
      .optional(),

    userType: Joi.string()
      .valid("buyer",  "seller")
      .required(),

    status: Joi.number().valid(0, 1).optional(),
    role: Joi.string().optional(),
    referredBy: Joi.string().optional(),

    // File upload is handled by multer, so validate only its existence
    profilePicture: Joi.any().optional(),
  }),
};

module.exports = { endUserSchemas };
