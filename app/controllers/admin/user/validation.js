const Joi = require('joi');

const userSchemas = {
    register: Joi.object().keys({
        name: Joi.string().required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
        roleId: Joi.number().integer().optional()
    }),
    login: Joi.object().keys({
        email: Joi.string().required(),
        password: Joi.string().required(),
    }),
    verifyOtp: Joi.object().keys({
        email: Joi.string().required(),
        otp: Joi.string().required(),
    }),
    forgotPassword: Joi.object().keys({
        email: Joi.string().required(),
    }),
    resetPassword: Joi.object().keys({
        email: Joi.string().required(),
        otp: Joi.string().required(),
        newPassword: Joi.string().required(), 
    }),
    changePassword: Joi.object().keys({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().required(),
    }),
    updateProfile: Joi.object().keys({
        name: Joi.string().required(),
        email: Joi.string().required(),
    })
};

module.exports = userSchemas;
