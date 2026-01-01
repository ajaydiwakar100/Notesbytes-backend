const Joi = require("joi");
const objectId = Joi.string().trim().length(24).hex(); // MongoDB ObjectId validator

const rolesSchemas = {
  create: Joi.object().keys({
    name: Joi.string().trim().required(),
    description: Joi.string().trim().optional(),
    status: Joi.boolean().optional(),
    permissionId: Joi.array().items(Joi.string().trim()).required(),
    _id: Joi.string().optional()
  }),

  update: Joi.object().keys({
    id: objectId.required(),
    name: Joi.string().trim().optional(),
    description: Joi.string().trim().optional(),
    status: Joi.boolean().optional(),
    permissionId: Joi.array().items(Joi.string().trim()).required(),
  }),

  delete: Joi.object().keys({
    id: objectId.required(),
  }),

  changeStatus: Joi.object().keys({
    id: objectId.required(),
    status: Joi.boolean().required(),
  }),
};

const moduleSchemas = {
  create: Joi.object().keys({
    name: Joi.string().trim().required(),
    description: Joi.string().trim().optional(),
    status: Joi.boolean().optional(),
  }),

  update: Joi.object().keys({
    id: objectId.required(),
    name: Joi.string().trim().optional(),
    description: Joi.string().trim().optional(),
    status: Joi.boolean().optional(),
  }),

  delete: Joi.object().keys({
    id: objectId.required(),
  }),
};

const permissionSchemas = {
  create: Joi.object().keys({
    name: Joi.string().trim().required(),
    moduleId: objectId.required(),  // moduleId reference
    description: Joi.string().trim().optional(),
    status: Joi.boolean().optional(),
  }),

  update: Joi.object().keys({
    id: objectId.required(),
    name: Joi.string().trim().optional(),
    moduleId: objectId.optional(),
    description: Joi.string().trim().optional(),
    status: Joi.boolean().optional(),
  }),

  delete: Joi.object().keys({
    id: objectId.required(),
  }),
};

module.exports = {
  moduleSchemas,
  rolesSchemas,
  permissionSchemas,
};
