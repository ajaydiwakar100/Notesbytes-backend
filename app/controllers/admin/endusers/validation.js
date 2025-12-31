const Joi = require("joi");

const endUserSchemas = {
  create: Joi.object().keys({
    name: Joi.string()
      .trim()
      .required()
      .messages({
        'string.empty': 'Name is required',
        'any.required': 'Name is required',
      }),

    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required',
      }),

    password: Joi.string()
      .trim()
      .min(8)
      .pattern(
        new RegExp(
          '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'
        )
      )
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base':
          'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
        'any.required': 'Password is required',
      }),

    phone: Joi.string()
      .pattern(/^[0-9]{7,15}$/)
      .required()
      .messages({
        'string.empty': 'Phone number is required',
        'string.pattern.base':
          'Phone number must contain only digits and be between 7 to 15 characters long',
        'any.required': 'Phone number is required',
      }),
  }),

  login: Joi.object().keys({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required',
      }),

    password: Joi.string()
      .trim()
      .min(8)
      .pattern(
        new RegExp(
          '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'
        )
      )
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base':
          'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
        'any.required': 'Password is required',
      }),
  })
};

module.exports = { endUserSchemas };
