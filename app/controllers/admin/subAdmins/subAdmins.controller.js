const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { Admin, Role, Permission, Module } = require("../../../models/index.js");
const passwordHelper = require("../../../helpers/password.helper");
const { sendTemplateEmail } = require("../../../helpers/email.helper.js");
const AppHelpers = require("../../../helpers/index.js");

const Controller = {

  // Centralized error handler
  handleError: (res, err, msg = "Internal server error") => {
    AppHelpers.ErrorLogger(msg, err);
    const retData = AppHelpers.Utils.responseObject();
    retData.status = "error";
    retData.code = 500;
    retData.httpCode = 500;
    retData.msg = err?.message || msg;
    return AppHelpers.Utils.cRes(res, retData);
  },

  create: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    const {
      name,
      email,
      phone,
      address,
      country,
      state,
      city,
      role,
      user_type,
      status
    } = req.body;

    try {

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ email });

      if (existingAdmin) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = AppHelpers.ResponseMessages.USER_EXIST;
        return AppHelpers.Utils.cRes(res, retData);
      }

      //  Generate and hash password
      const password = await passwordHelper.generatePassword(10);
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create admin document
      const admin = await Admin.create({
        name,
        email,
        phone,
        address,
        country,
        state,
        city,
        user_type,
        status: status ?? true,
        password: hashedPassword,
        roleId: role ? new mongoose.Types.ObjectId(role) : null,
        is_password_reset_required: true
      });

      // Send email with template
      await sendTemplateEmail({
        to: email,
        subject: AppHelpers.ResponseMessages.SUB_ADMIN_TEMPLATE,
        templateName: "subadmin-welcome",
        variables: {
          name,
          email,
          password,
          year: new Date().getFullYear(),
        },
      });

      // Prepare response
      const result = {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        address: admin.address,
        country: admin.country,
        state: admin.state,
        city: admin.city,
        user_type: admin.user_type,
        status: admin.status,
        roleId: admin.roleId,
        is_password_reset_required: admin.is_password_reset_required,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      };

      //  Send success response
      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.SUB_USER_CREATED;
      retData.data = result;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      console.error("ERROR in Controller.create", err);
      return Controller.handleError(res, err, "ERROR in Controller.create");
    }
  },

  list: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      // Fetch all sub-admin users
      const subAdmins = await Admin.find({ 
          user_type: { $in: ["Seller", "Buyer"] }
      })
        .sort({ createdAt: -1 })
        .lean();

      console.log(subAdmins);

      // Fetch all roles
      const roles = await Role.find().lean();

      // Fetch all permissions
      const permissions = await Permission.find().lean();

      // Fetch all modules
      const modules = await Module.find().lean();

      // Map modules for fast lookup
      const moduleMap = {};
      modules.forEach((mod) => {
        moduleMap[String(mod._id)] = mod.name;
      });

      // Map roles to each sub-admin with permissions structure
      const subAdminsWithRoleData = subAdmins.map((user) => {
        const role = roles.find((r) => String(r._id) === String(user.roleId));

        // Prepare permissions grouped by module
        const permissionsByModule = {};

        // Initialize with empty permission lists
        modules.forEach((mod) => {
          permissionsByModule[mod.name] = [];
        });

        if (role) {
          role.permissionId.forEach((pid) => {
            const perm = permissions.find((p) => String(p._id) === String(pid));
            if (perm) {
              const moduleName = moduleMap[String(perm.module)];
              if (moduleName) {
                permissionsByModule[moduleName].push({
                  id: perm._id,
                  name: perm.name,
                });
              }
            }
          });
        }

        return {
          ...user,
          role: role ? role.name : null,
          permissionsByModule,
        };
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = subAdminsWithRoleData.length
        ? AppHelpers.ResponseMessages.RECORDS_FOUND
        : AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
      retData.data = subAdminsWithRoleData;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in listSubAdmins");
    }
  },

  details: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = "Invalid Sub-Admin ID";
        return AppHelpers.Utils.cRes(res, retData);
      }

      // Fetch sub-admin from Admin table
      const user = await Admin.findById(id)
        .select("name email phone address country state city roleId user_type status")
        .lean();

      if (!user) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = "Sub Admin not found";
        return AppHelpers.Utils.cRes(res, retData);
      }

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.RECORDS_FOUND;
      retData.data = user;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in detailsSubAdmin");
    }
  },

  update: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = AppHelpers.ResponseMessages.INVALID_ID;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const { email, phone } = req.body;

      /** ----------------------------------
       *  EMAIL CHECK — must be unique
       * ---------------------------------- */
      if (email) {
        const emailExists = await Admin.findOne({
          email,
          _id: { $ne: id }, // exclude current user
        });

        if (emailExists) {
          retData.status = "error";
          retData.code = 400;
          retData.httpCode = 400;
          retData.msg = AppHelpers.ResponseMessages.EMAIL_OR_INVALID_ID;
          return AppHelpers.Utils.cRes(res, retData);
        }
      }

      /** ----------------------------------
       *  PHONE CHECK — must be unique
       * ---------------------------------- */
      if (phone) {
        const phoneExists = await Admin.findOne({
          phone,
          _id: { $ne: id }, // exclude current user
        });

        if (phoneExists) {
          retData.status = "error";
          retData.code = 400;
          retData.httpCode = 400;
          retData.msg = AppHelpers.ResponseMessages.EMAIL_OR_INVALID_ID;
          return AppHelpers.Utils.cRes(res, retData);
        }
      }

      /** ----------------------------------
       *  UPDATE DATA
       * ---------------------------------- */
      const updateData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        country: req.body.country,
        state: req.body.state,
        city: req.body.city,
        roleId: req.body.roleId,
        user_type: req.body.user_type,
        status: req.body.status,
        updatedAt: new Date(),
      };

      const updatedUser = await Admin.findByIdAndUpdate(id, updateData, { new: true });

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
      retData.msg = AppHelpers.ResponseMessages.PROFILE_UPDATED_SUCCESSFULLY;
      retData.data = updatedUser;

      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err, "ERROR in updateSubAdmin");
    }
  },

};

module.exports = Controller;
