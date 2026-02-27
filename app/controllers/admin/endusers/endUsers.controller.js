const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { User,PurchaseOrder, GlobalSetting, EmailTemplate, Refferal } = require("../../../models/index.js");
const passwordHelper = require("../../../helpers/password.helper");
const AppHelpers = require("../../../helpers/index.js");
const generateUniqueReferralCode = require("../../../helpers/referralCode.helper.js");
const PDFDocument = require("pdfkit");
const { sendEmail } = require("../../../helpers/email.helper.js");
const { sendDynamicTemplateEmail } = require("../../../helpers/email.helper.js");
const crypto = require("crypto");
const { isEmpty } = require("lodash");


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
        referralCode 
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
      const newReferralCode = await generateUniqueReferralCode(name);
      
      // 🔐 Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");


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
        referralCode: newReferralCode,
        status: 1,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
        referredBy:referralCode
      });

      if (referralCode && referralCode.trim() !== "") {

        const refferdBy = referralCode.trim().toUpperCase();

        // Find referrer
        const referrer = await User.findOne({ referralCode: refferdBy });

        if (!referrer) {
          throw new Error("Invalid referral code");
        }

        // Prevent self-referral
        if (referrer._id.toString() === user._id.toString()) {
          throw new Error("You cannot refer yourself");
        }

        // Prevent duplicate referral entry
        const existingReferral = await Refferal.findOne({
          referred_user_id: user._id
        });

        if (existingReferral) {
          throw new Error("Referral already applied");
        }

        // ✅ Create referral record
        await Refferal.create({
          referrer_id: referrer._id,
          referred_user_id: user._id,
          referral_code_used: false,
          status: "pending",
          commission_status: "pending",
          is_first_purchase: true
        });

      }

      // Send email with template
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      await sendDynamicTemplateEmail({
        to: user.email,
        templateKey: "EMAIL_VERIFICATION",
        variables: {
          name: user.name,
          verificationLink,
        },
      });
      retData.status = "success";
      retData.code = 201;
      retData.httpCode = 201;
      retData.msg = AppHelpers.ResponseMessages.END_USER_CREATED;
      retData.data = user;

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

      if (!user.emailVerified) {
        retData.status = "error";
        retData.code = 401;
        retData.httpCode = 401;
        retData.msg = AppHelpers.ResponseMessages.VERIFIED_EMAIL;
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
        //maxAge: 5 * 60 * 1000,
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

  // ---------------------------
  // Auth / Me
  // ---------------------------
  getMe: async function (req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select("-password");
      const retData = AppHelpers.Utils.responseObject();

      if (!user) {
        retData.status = "error";
        retData.code = 401;
        retData.msg = AppHelpers.ResponseMessages.USER_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      retData.status = "success";
      retData.data = user;
      retData.msg = "User authenticated";

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in getMe");
    }
  },

  // ---------------------------
  // Logout api 
  // ---------------------------
  logout: async function (req, res) {
    try {
      // Clear the HttpOnly cookie
      res.clearCookie("userAuthToken", {
        path: "/",
        httpOnly: true,
        secure: false, // only secure in prod
        sameSite: "lax", // or "strict" depending on your setup
      });

      // Return response
      const retData = AppHelpers.Utils.responseObject();
      retData.status = "success";
      retData.msg = "Logged out successfully";

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in logout");
    }
  },

  // ---------------------------
  // Purchase Orders / My Orders
  // ---------------------------
  getMyPurchaseOrders: async function (req, res) {
    try {
      const { userId } = req.query;
      const retData = AppHelpers.Utils.responseObject();

      // build condition dynamically
      const condition = {};
      if (userId) {
        condition.userId = userId;
      }

      const orders = await PurchaseOrder.find(condition)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .lean();

      retData.status = "success";
      retData.data = orders;
      retData.msg = userId
        ? "User purchase orders fetched successfully"
        : "All purchase orders fetched successfully";

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in getMyPurchaseOrders");
    }
  },


  // ---------------------------
  // Purchase Invoice
  // ---------------------------
  generateInvoice: async (req, res) => {
    try {
      const { orderId } = req.query;

      const order = await PurchaseOrder.findById(orderId)
        .populate("userId", "name email phone")
        .lean();

      if (!order) {
        return res.status(404).json({ status: "error", msg: "Order not found" });
      }

      // Fetch platform fee / processing fee from GlobalSetting
      const settings = await GlobalSetting.findOne({ key: "plateform_fee" }).lean();
      console.log(settings);
      const processingFee = Number(settings?.value || 0); // in INR
      console.log(processingFee);

      // Calculate grand total with commission
      const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const totalAmount = subtotal + processingFee;

      // Set headers for download
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=invoice_${order._id}.pdf`
      );
      res.setHeader("Content-Type", "application/pdf");

      const doc = new PDFDocument({ margin: 40 });
      doc.pipe(res);

      // ---------------- PDF HEADER ----------------
      doc
        .fontSize(20)
        .text("INVOICE", { align: "center" })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .text(`Invoice ID: ${order._id}`)
        .text(`Order ID: ${order.razorpayOrderId}`)
        .text(`Date: ${new Date(order.created_at).toLocaleDateString()}`);

      doc.moveDown();

      // ---------------- CUSTOMER DETAILS ----------------
      doc.fontSize(12).text("Billed To", { underline: true });
      doc
        .fontSize(10)
        .text(order.userId.name)
        .text(order.userId.email)
        .text(order.userId.phone || "-");

      doc.moveDown(1.5);

      // ================= TABLE =================
      const tableTop = doc.y;
      const itemX = 40;
      const qtyX = 280;
      const priceX = 340;
      const totalX = 410;

      // Table Header
      doc
        .fontSize(11)
        .text("Item", itemX, tableTop)
        .text("Qty", qtyX, tableTop)
        .text("Price", priceX, tableTop)
        .text("Total", totalX, tableTop);

      // Header line
      doc.moveTo(itemX, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      let yPosition = tableTop + 25;

      // Table Rows
      order.items.forEach((item, i) => {
        const itemTotal = item.price * item.quantity;

        doc
          .fontSize(10)
          .text(item.title, itemX, yPosition, { width: 240 })
          .text(item.quantity, qtyX, yPosition)
          .text(`${item.price}`, priceX, yPosition)
          .text(`${itemTotal}`, totalX, yPosition);

        yPosition += 20;

        // Page break safety
        if (yPosition > 720) {
          doc.addPage();
          yPosition = 50;
        }
      });

      // Bottom line
      doc.moveTo(itemX, yPosition).lineTo(550, yPosition).stroke();

      doc.moveDown(2);

      // ---------------- TOTAL SECTION ----------------
      doc
        .fontSize(10)
        .text(`Subtotal: ${subtotal}`, { align: "right" })
        .moveDown(0.5)
        .text(`Processing Fee: ${processingFee}`, { align: "right" })
        .moveDown(0.5)
        .text(`Grand Total: ${totalAmount}`, { align: "right" });

      doc.moveDown(3);

      // ---------------- FOOTER ----------------
      const footerY = doc.page.height - 60;
      doc
        .fontSize(9)
        .text(
          "This is a system-generated invoice. No signature required.",
          40,
          footerY,
          { align: "center", width: 500 }
        );

      doc
        .fontSize(9)
        .text(
          "Thank you for your purchase!",
          40,
          footerY + 15,
          { align: "center", width: 500 }
        );

      doc.end();
    } catch (err) {
      console.error("Invoice error:", err);
      res.status(500).json({ status: "error", msg: "Invoice generation failed" });
    }
  },

  // ---------------------------
  // Update Profile 
  // ---------------------------
  updateProfile: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const userId = req.user.id;

      const {
        name,
        phone,
        email,
        city,
        state,
        preferredLanguage,
        consent,
        sellerType
      } = req.body;

      const user = await User.findById(userId);

      if (!user) {
        retData.status = "error";
        retData.code = 404;
        retData.msg = AppHelpers.ResponseMessages.USER_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      // ---------- CONSENT LOGIC ----------
      let consentStatus;
      if (consent && typeof consent === "object") {
        const { termsAccepted, contentOwnership, marketingEmails } = consent;

        consentStatus =
          termsAccepted === true &&
          contentOwnership === true &&
          marketingEmails === true
            ? "Yes"
            : "No";
      }
      // ----------------------------------

      // Update only allowed & provided fields
      if (name !== undefined) user.name = name;
      if (city !== undefined) user.city = city;
      if (state !== undefined) user.state = state;
      if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;
      if (consentStatus !== undefined) user.consent = consentStatus;
      if (sellerType !== undefined) user.userType = sellerType;
      user.isProfileFill = "Yes";
      await user.save();

      const updatedUser = await User.findById(userId).select("-password");

      retData.status = "success";
      retData.msg = "Profile updated successfully";
      retData.data = updatedUser;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in updateProfile");
    }
  },


  // ---------------------------
  // Verified Email
  // ---------------------------
  verifyEmail: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { token } = req.params;

      if (!token) {
        retData.status = "error";
        retData.httpCode = 400;
        retData.msg = "Verification token is required";
        return AppHelpers.Utils.cRes(res, retData);
      }

      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() },
      });

      if (!user) {
        retData.status = "error";
        retData.httpCode = 400;
        retData.msg = "Invalid or expired verification link";
        return AppHelpers.Utils.cRes(res, retData);
      }

      if (user.emailVerified) {
        retData.status = "success";
        retData.httpCode = 200;
        retData.msg = "Email already verified";
        return AppHelpers.Utils.cRes(res, retData);
      }

      // ✅ Mark verified
      user.emailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();

      // ✅ Send Welcome Email using dynamic template
      await sendDynamicTemplateEmail({
        to: user.email,
        templateKey: "WELCOME_WITH_REFERRAL",
        variables: {
          name: user.name,
          referralCode: user.referralCode || "",
        },
      });

      retData.status = "success";
      retData.httpCode = 200;
      retData.msg = "Email verified successfully";

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR verifying email");
    }
  },

  // ---------------------------
  // Forgot Password
  // ---------------------------
  forgotPassword: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { email } = req.body;

      if (!email) {
        retData.status = "error";
        retData.httpCode = 400;
        retData.msg = "Email is required";
        return AppHelpers.Utils.cRes(res, retData);
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });

      if (!user) {
        retData.status = "error";
        retData.httpCode = 404;
        retData.msg = "User not found with this email";
        return AppHelpers.Utils.cRes(res, retData);
      }

      if (!user.emailVerified) {
        retData.status = "error";
        retData.httpCode = 400;
        retData.msg = "Please verify your email first";
        return AppHelpers.Utils.cRes(res, retData);
      }

      // ✅ Generate Secure Token
      const resetToken = crypto.randomBytes(32).toString("hex");

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

      await user.save();

      // ✅ Create Reset Link
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      // ✅ Send Email
      await sendDynamicTemplateEmail({
        to: user.email,
        templateKey: "FORGOT_PASSWORD",
        variables: {
          name: user.name,
          resetLink,
        },
      });

      retData.status = "success";
      retData.httpCode = 200;
      retData.msg = "Password reset link sent to your email";

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR forgot password");
    }
  },

  // ---------------------------
  // Reset Password
  // ---------------------------
  resetPassword: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { token, password } = req.body;

      if (!token || !password) {
        retData.status = "error";
        retData.httpCode = 400;
        retData.msg = "Token and password are required";
        return AppHelpers.Utils.cRes(res, retData);
      }

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        retData.status = "error";
        retData.httpCode = 400;
        retData.msg = "Invalid or expired reset link";
        return AppHelpers.Utils.cRes(res, retData);
      }

      // ✅ Update Password
      user.password = await bcrypt.hash(password, 10);; // assuming pre-save hook hashes it

      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;

      await user.save();

      // ✅ Optional: Send confirmation email
      await sendDynamicTemplateEmail({
        to: user.email,
        templateKey: "PASSWORD_CHANGED",
        variables: {
          name: user.name,
        },
      });

      retData.status = "success";
      retData.httpCode = 200;
      retData.msg = "Password reset successfully";

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR resetting password");
    }
  },

};

module.exports = Controller;
