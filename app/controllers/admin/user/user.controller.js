const bcrypt = require("bcrypt");
const { Admin, User, Document, PurchaseOrder, } = require("../../../models/index.js");
const AppHelpers = require("../../../helpers/index.js");
const userHelper = require("./helper.js");
const crypto = require("crypto");
const { sendDynamicTemplateEmail } = require("../../../helpers/email.helper.js")

const Controller = {
  // ---------------------------
  // Centralized error handler
  // ---------------------------
  handleError: function (res, err, msg = "Internal server error") {
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
  register: async function (req, res) {
    const retData = AppHelpers.Utils.responseObject();
    const { name, email, password, roleId } = req.body;

    try {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        retData.status = "error";
        retData.code = 400;
        retData.msg = AppHelpers.ResponseMessages.USER_EXIST;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const admin = await Admin.create({
        name,
        email,
        //roleId,
        password: hashedPassword,
      });

      const profileData = await userHelper.getAdminProfileData(admin._id);

      retData.status = "success";
      retData.code = 200;
      retData.msg = AppHelpers.ResponseMessages.VALID_USER;
      retData.data = profileData;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in register");
    }
  },

  // ---------------------------
  // Login
  // ---------------------------
  login: async function (req, res) {
    const retData = AppHelpers.Utils.responseObject();
    const { email, password } = req.body;
    console.log(email);
    try {
      const admin = await Admin.findOne({ email });
      if (!admin) {
        retData.status = "error";
        retData.code = 401;
        retData.msg = AppHelpers.ResponseMessages.INVALID_LOGIN;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        retData.status = "error";
        retData.code = 401;
        retData.msg = AppHelpers.ResponseMessages.INVALID_LOGIN;
        return AppHelpers.Utils.cRes(res, retData);
      }

      //const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpCode = 123456;
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await Admin.findByIdAndUpdate(admin._id, {
        otp_code: otpCode,
        otp_expires_at: otpExpiresAt,
      });

      retData.status = "success";
      retData.msg = AppHelpers.ResponseMessages.CODE_SEND_EMAIL;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in login");
    }
  },

  // ---------------------------
  // OTP Verification
  // ---------------------------
  verifyOtp: async function (req, res) {
    const retData = AppHelpers.Utils.responseObject();
    const { email, otp } = req.body;

    try {
      const admin = await Admin.findOne({ email });

      if (!admin) {
        retData.status = "error";
        retData.code = 404;
        retData.msg = AppHelpers.ResponseMessages.USER_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      if (!admin.otp_code || admin.otp_code !== otp) {
        retData.status = "error";
        retData.code = 400;
        retData.msg = AppHelpers.ResponseMessages.INVALID_OTP;
        return AppHelpers.Utils.cRes(res, retData);
      }

      if (!admin.otp_expires_at || admin.otp_expires_at < new Date()) {
        retData.status = "error";
        retData.code = 400;
        retData.msg = AppHelpers.ResponseMessages.EXPIRED_OTP;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const updatedAdmin = await Admin.findByIdAndUpdate(
        admin._id,
        {
          otp_code: null,
          otp_expires_at: null,
          $inc: { token_version: 1 },
        },
        { new: true }
      );

      const token = await AppHelpers.GenJWTToken({
        userType: "admin",
        id: admin._id,
        tokenVersion: updatedAdmin.token_version,
      });

      const profileData = await userHelper.getAdminProfileData(admin._id);
      profileData.auth_token = token;

      retData.status = "success";
      retData.code = 200;
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
  forgetPassword: async function (req, res) {
    const { email } = req.body;
    const retData = AppHelpers.Utils.responseObject();

    try {
      if (!email) {
        retData.status = "error";
        retData.code = 400;
        retData.msg = "Email is required";
        return AppHelpers.Utils.cRes(res, retData);
      }

      // 1️⃣ Find admin
      const admin = await Admin.findOne({ email });

      if (!admin) {
        retData.status = "error";
        retData.code = 404;
        retData.msg = AppHelpers.ResponseMessages.USER_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      // 2️⃣ Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // 3️⃣ Save token in DB
      await Admin.findByIdAndUpdate(admin._id, {
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry,
      });

      // 4️⃣ Create reset link
      const resetLink = `${process.env.ADMIN_BASE_URL}/reset-password?token=${resetToken}`;


      // 5️⃣ Send email
     await sendDynamicTemplateEmail({
        to: admin.email,
        templateKey: "FORGOT_PASSWORD",
        variables: {
          name: admin.name,
          resetLink,
        },
      });

      retData.status = "success";
      retData.code = 200;
      retData.msg = "Reset link sent to your email";

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in forgetPassword");
    }
  },

  // ---------------------------
  // Reset Password
  // ---------------------------


  resetPassword: async function (req, res) {
    const { token, password } = req.body;
    const retData = AppHelpers.Utils.responseObject();

    try {
      if (!token || !password) {
        retData.status = "error";
        retData.code = 400;
        retData.msg = "Token and password are required";
        return AppHelpers.Utils.cRes(res, retData);
      }

      // 1️⃣ Find admin by valid token
      const admin = await Admin.findOne({
        reset_token: token,
        reset_token_expiry: { $gt: new Date() },
      });

      if (!admin) {
        retData.status = "error";
        retData.code = 400;
        retData.msg = "Invalid or expired reset link";
        return AppHelpers.Utils.cRes(res, retData);
      }

      // 2️⃣ Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3️⃣ Update password and clear token
      await Admin.findByIdAndUpdate(admin._id, {
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      });

      retData.status = "success";
      retData.code = 200;
      retData.msg = AppHelpers.ResponseMessages.PASSWORD_RESET_SUCCESS;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in resetPassword");
    }
  },

  // ---------------------------
  // Profile
  // ---------------------------
  getProfile: async function (req, res) {
    try {
      const adminId = req.user.id;
      const profile = await userHelper.getAdminProfileData(adminId);

      const retData = AppHelpers.Utils.responseObject();

      if (!profile) {
        retData.status = "error";
        retData.code = 404;
        retData.msg = AppHelpers.ResponseMessages.USER_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      retData.status = "success";
      retData.data = profile;
      retData.msg = AppHelpers.ResponseMessages.PROFILE_FETCH_SUCESSFULLY;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in getProfile");
    }
  },


  // ---------------------------
  // Update Profile
  // ---------------------------
  updateProfile: async (req, res) => {
    const { name, email } = req.body;

    try {
      const retData = AppHelpers.Utils.responseObject();

      // Admin ID from JWT middleware
      const adminId = req.user._id || req.user.id; // mongoose uses _id

      // Fetch admin from MongoDB
      const admin = await Admin.findById(adminId);
      if (!admin) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 200;
        retData.msg = AppHelpers.ResponseMessages.USER_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      // Update fields
      admin.name = name || admin.name;
      admin.email = email || admin.email;

      // Save updated admin
      const updatedAdmin = await admin.save();

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg =
        AppHelpers.ResponseMessages.PROFILE_UPDATED_SUCCESSFULLY ||
        "Profile updated successfully";
      retData.data = updatedAdmin;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in updateProfile");
    }
  },

  // ---------------------------
  // Change Password
  // ---------------------------
  changePassword: async function (req, res) {
    const { oldPassword, newPassword } = req.body;
    const retData = AppHelpers.Utils.responseObject();

    try {
      const adminId = req.user.id;
      const admin = await Admin.findById(adminId);

      if (!admin) {
        retData.status = "error";
        retData.code = 404;
        retData.msg = AppHelpers.ResponseMessages.USER_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        oldPassword,
        admin.password
      );

      if (!isCurrentPasswordValid) {
        retData.status = "error";
        retData.code = 400;
        retData.msg = AppHelpers.ResponseMessages.CURRENT_PASSWORD_INVALID;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await Admin.findByIdAndUpdate(adminId, { password: hashedPassword });

      retData.status = "success";
      retData.msg = AppHelpers.ResponseMessages.PASSWORD_CHANGE_SUCESSFULLY;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in changePassword");
    }
  },

  // ---------------------------
  // Logout
  // ---------------------------
  logout: async function (req, res) {
    try {
      const adminId = req.user.id;

      await Admin.findByIdAndUpdate(adminId, { $inc: { token_version: 1 } });

      const retData = AppHelpers.Utils.responseObject();
      retData.status = "success";
      retData.msg = AppHelpers.ResponseMessages.LOGOUT_SUCCESSFULLY;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in logout");
    }
  },

  dashboard: async function (req, res) {
    try {
     
      // Total Users
      const totalUsers = await User.countDocuments({
        //role: "user", // adjust if needed
      });

      // Purchased Documents (total purchased items count)
      const totalPurchasedDocs = await PurchaseOrder.aggregate([
        { $unwind: "$items" },
        { $count: "total" }
      ]);

      // Pending Documents
      const totalPendingDocs = await Document.countDocuments({
        approvalStatus: "pending", // adjust based on your schema
      });

      // Approved Documents
      const totalApprovedDocs = await Document.countDocuments({
        approvalStatus: "approved",
      });

      const retData = AppHelpers.Utils.responseObject();
      retData.status = "success";
      retData.msg = "Dashboard data fetched successfully";
      retData.data = {
        totalUsers,
        totalPurchasedDocs: totalPurchasedDocs[0]?.total || 0,
        totalPendingDocs,
        totalApprovedDocs,
      };

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in dashboard");
    }
  },
};

module.exports = Controller;
