const Joi = require("joi");

const rolesSchemas = {
  create: Joi.object().keys({
    name: Joi.string().trim().required(),
    description: Joi.string().trim().optional(),
    status: Joi.boolean().optional(),
  }),
  update: Joi.object().keys({
    id: Joi.number().integer().required(),
    name: Joi.string().trim().optional(),
    description: Joi.string().trim().optional(),
    status: Joi.boolean().optional(),
  }),
  delete: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
  changeStatus: Joi.object().keys({
    id: Joi.number().integer().required(),
    status: Joi.boolean().required(),
  }),
};

const moduleSchemas = {
  create: Joi.object().keys({
    name: Joi.string().trim().required(),
    description: Joi.string().trim().optional(),
  }),
  update: Joi.object().keys({
    id: Joi.number().integer().required(),
    name: Joi.string().trim().optional(),
    description: Joi.string().trim().optional(),
  }),
  delete: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
};

const permissionSchemas = {
  create: Joi.object().keys({
    name: Joi.string().trim().required(),
    moduleId: Joi.number().integer().required(),
    description: Joi.string().trim().optional(),
  }),
  update: Joi.object().keys({
    id: Joi.number().integer().required(),
    name: Joi.string().trim().optional(),
    moduleId: Joi.number().integer().optional(),
    description: Joi.string().trim().optional(),
  }),
  delete: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
};

module.exports = {
  moduleSchemas,
  rolesSchemas,
  permissionSchemas,
};
