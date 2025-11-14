// app/helpers/index.js
const utilHelper = require("./utils.helper");
const { GenJWTToken, DecodeJWTToken } = require("./token.helper");
const responseMessages = require("./responseMessages.helper");
const emailService = require("./email.service");
const ErrorLogger = require("./error-log.helper");
const passwordHelper = require("./password.helper");

const AppHelpers = {
  Utils: utilHelper,
  GenJWTToken,
  DecodeJWTToken,
  ResponseMessages: responseMessages,
  Email: emailService,
  ErrorLogger,
  Password: passwordHelper,
};

module.exports = AppHelpers;
