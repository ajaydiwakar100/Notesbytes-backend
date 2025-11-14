const Joi = require('joi');

const gobalSettingsSchemas = {
  addGolbalSetting: Joi.object({
    key: Joi.string().required(),
    value: Joi.string().required(),
  }),

  editGolbalSetting: Joi.object({
    id: Joi.string().required(),
  }),

  deleteGolbalSetting: Joi.object({
    id: Joi.string().required(),
  }),
};

module.exports = gobalSettingsSchemas;
