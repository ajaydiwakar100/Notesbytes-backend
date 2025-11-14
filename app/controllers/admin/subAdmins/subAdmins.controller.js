const bcrypt = require("bcrypt");
const prisma = require("../../../models/index");
const passwordHelper = require("../../../helpers/password.helper");

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
      roleId,
      phone,
      address,
      country,
      state,
      city,
      user_type,
      status,
      is_password_reset_required,
    } = req.body;

    try {
      // Check if admin already exists
      const existingAdmin = await prisma.admin.findUnique({ where: { email } });

      if (existingAdmin) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = AppHelpers.ResponseMessages.USER_EXIST;
        return AppHelpers.Utils.cRes(res, retData);
      }

      // Hash password
      const password = await passwordHelper.generatePassword(10);
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create admin record
      const admin = await prisma.admin.create({
        data: {
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
          roleId,
          is_password_reset_required: is_password_reset_required ?? true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          country: true,
          state: true,
          city: true,
          user_type: true,
          status: true,
          roleId: true,
          is_password_reset_required: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Send success response
      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.USER_CREATED;
      retData.data = admin;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      console.error("ERROR in Controller.create", err);
      return Controller.handleError(res, err, "ERROR in Controller.create");
    }
  },
};

module.exports = Controller;
