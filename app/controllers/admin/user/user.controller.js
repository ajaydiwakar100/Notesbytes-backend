const bcrypt = require('bcrypt');
const prisma = require('../../../models/index.js');         // Prisma client
const AppHelpers = require('../../../helpers/index.js'); // Utils & ResponseMessages
const userHelper = require('./helper.js');                  // getAdminProfileData helper

const Controller = {

  // ---------------------------
  // Centralized error handler
  // ---------------------------
  handleError: function(res, err, msg = "Internal server error") {
    AppHelpers.ErrorLogger(msg, err);
    const retData = AppHelpers.Utils.responseObject();
    retData.status = "error";
    retData.code = 500;
    retData.httpCode = 500;
    retData.msg = err?.message || msg;
    return AppHelpers.Utils.cRes(res, retData);
  },

  // ---------------------------
  // Admin Registration
  // ---------------------------
  register: async function(req, res) {
    const retData = AppHelpers.Utils.responseObject();
    const { name, email, password, roleId } = req.body;

    try {
      const existingAdmin = await prisma.admin.findUnique({ where: { email } });
      if (existingAdmin) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 200;
        retData.msg = AppHelpers.ResponseMessages.USER_EXIST || "Admin already exists";
        return AppHelpers.Utils.cRes(res, retData);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const admin = await prisma.admin.create({
        data: { name, email, password: hashedPassword, roleId },
      });

      const profileData = await userHelper.getAdminProfileData(admin.id);

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.VALID_USER;
      retData.data = profileData;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in Controller.register");
    }
  },

  // ---------------------------
  // Admin Login
  // ---------------------------
  login: async function(req, res) {
    const retData = AppHelpers.Utils.responseObject();
    const { email, password } = req.body;

    try {
      const admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin) {
        retData.status = "error";
        retData.code = 401;
        retData.httpCode = 200;
        retData.msg = AppHelpers.ResponseMessages.INVALID_LOGIN;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        retData.status = "error";
        retData.code = 401;
        retData.httpCode = 200;
        retData.msg = AppHelpers.ResponseMessages.INVALID_LOGIN;
        return AppHelpers.Utils.cRes(res, retData);
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await prisma.admin.update({
        where: { id: admin.id },
        data: { otp_code: otpCode, otp_expires_at: otpExpiresAt },
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.CODE_SEND_EMAIL;
      retData.data = null;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in login");
    }
  },

  // ---------------------------
  // OTP Verification
  // ---------------------------
  verifyOtp: async function(req, res) {
    const retData = AppHelpers.Utils.responseObject();
    const { email, otp } = req.body;

    try {
      const admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 200;
        retData.msg = AppHelpers.ResponseMessages.USER_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      if (!admin.otp_code || admin.otp_code !== otp) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 200;
        retData.msg = AppHelpers.ResponseMessages.INVALID_OTP;
        return AppHelpers.Utils.cRes(res, retData);
      }

      if (!admin.otp_expires_at || admin.otp_expires_at < new Date()) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 200;
        retData.msg = AppHelpers.ResponseMessages.EXPIRED_OTP;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const updatedAdmin = await prisma.admin.update({
        where: { id: admin.id },
        data: { otp_code: null, otp_expires_at: null, token_version: { increment: 1 } },
      });

      const token = await AppHelpers.GenJWTToken({
        userType: "admin",
        id: admin.id,
        tokenVersion: updatedAdmin.token_version
      });

      const profileData = await userHelper.getAdminProfileData(admin.id);
      profileData.auth_token = token;

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.LOGIN_SUCCESS;
      retData.data = profileData;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in verifyOtp");
    }
  },

  // ---------------------------
  // Forget Password
  // ---------------------------
  forgetPassword: async function(req, res) {
    const { email } = req.body;
    const retData = AppHelpers.Utils.responseObject();

    try {
      const admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin) {
        retData.status = "error";
        retData.code = 404;
        retData.msg = AppHelpers.ResponseMessages.USER_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      await prisma.admin.update({
        where: { id: admin.id },
        data: { otp_code: otpCode, otp_expires_at: otpExpiresAt },
      });

      retData.status = "success";
      retData.code = 200;
      retData.msg = AppHelpers.ResponseMessages.CODE_SEND_EMAIL;
      retData.data = null;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in forgetPassword");
    }
  },

  // ---------------------------
  // Reset Password
  // ---------------------------
  resetPassword: async function(req, res) {
    const { email, otp, newPassword } = req.body;
    const retData = AppHelpers.Utils.responseObject();

    try {
      const admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin) {
        retData.status = "error";
        retData.code = 404;
        retData.msg = AppHelpers.ResponseMessages.USER_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const now = new Date();
      if (!admin.otp_code || admin.otp_code !== otp || !admin.otp_expires_at || admin.otp_expires_at < now) {
        retData.status = "error";
        retData.code = 400;
        retData.msg = AppHelpers.ResponseMessages.INVALID_OTP_EXPIRED;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.admin.update({
        where: { id: admin.id },
        data: { password: hashedPassword, otp_code: null, otp_expires_at: null },
      });

      retData.status = "success";
      retData.code = 200;
      retData.msg = AppHelpers.ResponseMessages.PASSWORD_RESET_SUCCESS;
      retData.data = null;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in resetPassword");
    }
  },

  // ---------------------------
  // Profile
  // ---------------------------
  getProfile: async function(req, res) {
    try {
      const retData = AppHelpers.Utils.responseObject();
      const adminId = req.user.id;

      const profile = await userHelper.getAdminProfileData(adminId);
      if (!profile) {
        retData.status = "error";
        retData.code = 404;
        retData.msg = AppHelpers.ResponseMessages.USER_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      retData.status = "success";
      retData.code = 200;
      retData.msg = AppHelpers.ResponseMessages.PROFILE_FETCH_SUCESSFULLY;
      retData.data = profile;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in getProfile");
    }
  },

  // ---------------------------
  // Change Password
  // ---------------------------
  changePassword: async function(req, res) {
    const { oldPassword, newPassword } = req.body;
    const retData = AppHelpers.Utils.responseObject();

    try {
      const adminId = req.user.id;
      const admin = await prisma.admin.findUnique({ where: { id: adminId } });
      if (!admin) {
        retData.status = "error";
        retData.code = 404;
        retData.msg = AppHelpers.ResponseMessages.USER_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const isCurrentPasswordValid = await bcrypt.compare(oldPassword, admin.password);
      if (!isCurrentPasswordValid) {
        retData.status = "error";
        retData.code = 400;
        retData.msg = AppHelpers.ResponseMessages.CURRENT_PASSWORD_INVALID;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.admin.update({ where: { id: adminId }, data: { password: hashedPassword } });

      retData.status = "success";
      retData.code = 200;
      retData.msg = AppHelpers.ResponseMessages.PASSWORD_CHANGE_SUCESSFULLY;
      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in changePassword");
    }
  },

  // ---------------------------
  // Update Profile
  // ---------------------------
  updateProfile: async function(req, res) {
    const { name, email } = req.body;
    const retData = AppHelpers.Utils.responseObject();

    try {
      const adminId = req.user.id;
      const admin = await prisma.admin.findUnique({ where: { id: adminId } });
      if (!admin) {
        retData.status = "error";
        retData.code = 404;
        retData.msg = AppHelpers.ResponseMessages.USER_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const updatedAdmin = await prisma.admin.update({
        where: { id: adminId },
        data: { name, email },
      });

      retData.status = "success";
      retData.code = 200;
      retData.msg = AppHelpers.ResponseMessages.PROFILE_UPDATED_SUCCESSFULLY;
      retData.data = updatedAdmin;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in updateProfile");
    }
  },

  // ---------------------------
  // Logout
  // ---------------------------
  logout: async function(req, res) {
    try {
      const retData = AppHelpers.Utils.responseObject();
      const adminId = req.user.id;

      await prisma.admin.update({
        where: { id: adminId },
        data: { token_version: { increment: 1 } },
      });

      retData.status = "success";
      retData.code = 200;
      retData.msg = AppHelpers.ResponseMessages.LOGOUT_SUCCESSFULLY;
      retData.data = {};

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      AppHelpers.ErrorLogger("ERROR in logout", err);
      return AppHelpers.Utils.cRes(res, {
        status: "error",
        code: 500,
        msg: "Logout failed",
      });
    }
  },

};

module.exports = Controller;
