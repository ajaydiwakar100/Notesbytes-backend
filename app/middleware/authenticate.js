const AppHelpers = global.AppHelpers;
const _ = require("lodash");

// Import MongoDB Models
const Admin = require("../models/admin.model");
// const User = require("../models/User");
// const Agent = require("../models/Agent");

const Authenticate = async (req, res, next) => {
  let retData = AppHelpers.Utils.responseObject();

  try {
    const authHeader = req.headers["authorization"];

    if (_.isEmpty(authHeader)) {
      return AppHelpers.Utils.cRes(res, {
        ...retData,
        status: "error",
        code: 403,
        httpCode: 403,
        msg: "Unauthorized Request. Authorization token is missing.",
      });
    }

    const [tokenPrefix, token] = authHeader.split(" ");

    if (tokenPrefix !== "Bearer" || !token) {
      return AppHelpers.Utils.cRes(res, {
        ...retData,
        status: "error",
        code: 403,
        httpCode: 403,
        msg: "Unauthorized Request.",
      });
    }

    // 🔐 Decode JWT
    const decoded = await AppHelpers.DecodeJWTToken(token);

    if (!decoded?.data?.id || !decoded?.data?.userType) {
      return AppHelpers.Utils.cRes(res, {
        ...retData,
        status: "error",
        code: 403,
        httpCode: 403,
        msg: AppHelpers.ResponseMessages.INVALID_TOKEN,
      });
    }

    const { id, userType, tokenVersion: tokenVersionFromJWT } = decoded.data;

    let user;

    // 👇 Fetch Based On userType
    if (userType === "admin") {
      user = await Admin.findById(id).lean();
    } else {
      return AppHelpers.Utils.cRes(res, {
        ...retData,
        status: "error",
        code: 403,
        httpCode: 403,
        msg: AppHelpers.ResponseMessages.INVALID_TOKEN,
      });
    }

    // If user not found
    if (!user) {
      return AppHelpers.Utils.cRes(res, {
        ...retData,
        status: "error",
        code: 403,
        httpCode: 403,
        msg: AppHelpers.ResponseMessages.INVALID_TOKEN,
      });
    }

    // Token version check
    const dbTokenVersion = user.tokenVersion || user.token_version || 0;

    if (tokenVersionFromJWT !== dbTokenVersion) {
      return AppHelpers.Utils.cRes(res, {
        ...retData,
        status: "error",
        code: 401,
        httpCode: 401,
        msg: "Token is invalid or has expired. Please log in again.",
      });
    }

    // Attach user to request
    req.user = { ...user, userType };

    next();
  } catch (err) {
    AppHelpers.ErrorLogger("ERROR in Authenticate Middleware", err);

    const msg =
      err.name === "TokenExpiredError"
        ? "Your session has timed out. Please log in again."
        : AppHelpers.ResponseMessages.INVALID_TOKEN;

    return AppHelpers.Utils.cRes(res, {
      ...retData,
      status: "error",
      code: 403,
      httpCode: 403,
      msg,
    });
  }
};

module.exports = Authenticate;
