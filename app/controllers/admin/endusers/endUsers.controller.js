const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { User } = require("../../../models/index.js");
const passwordHelper = require("../../../helpers/password.helper");
const AppHelpers = require("../../../helpers/index.js");
const generateUniqueReferralCode = require("../../../helpers/referralCode.helper.js");


const Controller = {

  // ERROR HANDLER
  handleError: (res, err, msg = "Internal server error") => {
    AppHelpers.ErrorLogger(msg, err);
    const retData = AppHelpers.Utils.responseObject();
    retData.status = "error";
    retData.code = 500;
    retData.httpCode = 500;
    retData.msg = err?.message || msg;
    return AppHelpers.Utils.cRes(res, retData);
  },

  // --------------------------------------------------------
  // CREATE USER (buyer / subadmin) WITH PROFILE PIC
  // --------------------------------------------------------
  create: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    try {
      const {
        name,
        email,
        phone,
        password,
      } = req.body;

      // Check if email already exists
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = AppHelpers.ResponseMessages.EMAIL_OR_INVALID_ID; // e.g., "User with this email already exists"
        return AppHelpers.Utils.cRes(res, retData);
      }

      // Check if phone already exists
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = AppHelpers.ResponseMessages.EMAIL_OR_INVALID_ID;
        return AppHelpers.Utils.cRes(res, retData);
      }

      // Generate referral code
      const referralCode = await generateUniqueReferralCode(name);

      // Hash password (REMOVE this if using schema pre-save hook)
      const hashedPassword = await bcrypt.hash(password, 10);
      const userType = "both";

      // Create user
      const user = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        userType,
        referralCode,
        status: 1
      });

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $inc: { token_version: 1 },
        },
        { new: true }
      );

      const token = await AppHelpers.GenJWTToken({
        userType: "users",
        id: user._id,
        tokenVersion: updatedUser.token_version,
      });

      // Remove password from response
      const userObj = user.toObject();
      delete userObj.password;
     
      // Send token as HttpOnly cookie (more secure than sending in JSON)
      res.cookie("userAuthToken", token, {
        httpOnly: true,
        secure: false, 
        sameSite: "Lax",
        maxAge: 6 * 60 * 60 * 1000, // 6 hours
      });

      retData.status = "success";
      retData.code = 201;
      retData.httpCode = 201;
      retData.msg = AppHelpers.ResponseMessages.END_USER_CREATED;
      retData.data = userObj;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in end-user create");
    }
  },

  // --------------------------------------------------------
  // LIST USERS + PROFILE PIC PATH
  // --------------------------------------------------------
  getList: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { user_type } = req.query;
      console.log(user_type);
      let filter = {};
      if (user_type && user_type !== "all") {
        filter.userType = user_type;
      }

      const users = await User.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      // add full image path
      users.forEach(u => {
        if (u.profilePicture && !u.profilePicture.includes("http")) {
          u.profilePicture = `${process.env.BASE_URL}/${u.profilePicture}`;
        }
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = users.length
        ? AppHelpers.ResponseMessages.RECORDS_FOUND
        : AppHelpers.ResponseMessages.NO_RECORDS_FOUND;

      retData.data = users;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in getList");
    }
  },

  // --------------------------------------------------------
  // USER DETAILS WITH PROFILE PIC PATH
  // --------------------------------------------------------
  details: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = "Invalid ID";
        return AppHelpers.Utils.cRes(res, retData);
      }

      const user = await User.findById(id).lean();

      if (!user) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = "User not found";
        return AppHelpers.Utils.cRes(res, retData);
      }

      if (user.profilePicture && !user.profilePicture.includes("http")) {
        user.profilePicture = `${process.env.BASE_URL}/${user.profilePicture}`;
      }

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.RECORDS_FOUND;
      retData.data = user;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in details");
    }
  },

  // --------------------------------------------------------
  // UPDATE ONLY STATUS
  // --------------------------------------------------------
  updateStatus: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id, status } = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = AppHelpers.ResponseMessages.INVALID_ID;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { status, updatedAt: new Date() },
        { new: true }
      );

      if (!updatedUser) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.USER_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = "Status updated successfully";
      retData.data = updatedUser;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in updateStatus");
    }
  },

  // --------------------------------------------------------
  // GET REFERRAL USERS OF A USER
  // --------------------------------------------------------
  referrals: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id } = req.params;

      // Validate ID
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = "Invalid ID";
        return AppHelpers.Utils.cRes(res, retData);
      }

      // Check if user exists
      const mainUser = await User.findById(id).lean();

      if (!mainUser) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = "User not found";
        return AppHelpers.Utils.cRes(res, retData);
      }

      // Fetch referral users
      const referralUsers = await User.find({ referredBy: mainUser.referralCode })
        .sort({ createdAt: -1 })
        .lean();

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = "Referral users fetched successfully";
      retData.data = referralUsers;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in referrals");
    }
  },

  // --------------------------------------------------------
  // LOGIN USER (buyer / subadmin)
  // --------------------------------------------------------
  login: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        retData.status = "error";
        retData.code = 401;
        retData.httpCode = 401;
        retData.msg = AppHelpers.ResponseMessages.INVALID_LOGIN;
        return AppHelpers.Utils.cRes(res, retData);
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        retData.status = "error";
        retData.code = 401;
        retData.httpCode = 401;
        retData.msg = AppHelpers.ResponseMessages.INVALID_LOGIN;
        return AppHelpers.Utils.cRes(res, retData);
      }

      // Increment token version for security (optional)
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $inc: { token_version: 1 } },
        { new: true }
      );

      // Generate JWT token
      const token = await AppHelpers.GenJWTToken({
        userType: "users",
        id: user._id,
        tokenVersion: updatedUser.token_version,
      });

      // Remove password from response
      const userObj = user.toObject();
      delete userObj.password;

      // Send token as HttpOnly cookie (more secure than sending in JSON)
      res.cookie("userAuthToken", token, {
        httpOnly: true,
        secure: false,      
        sameSite: "Lax",
        maxAge: 6 * 60 * 60 * 1000,
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.LOGIN_SUCCESS; // e.g., "Login successful"
      retData.data = userObj;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in end-user login");
    }
  },


};

module.exports = Controller;
