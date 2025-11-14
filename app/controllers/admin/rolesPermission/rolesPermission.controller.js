const prisma = require("../../../models/index");
const AppHelpers = require("../../../helpers/index"); // adjust path if needed

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
    const { name, description, status } = req.body;

    try {
      const existingRole = await prisma.role.findUnique({ where: { name } });

      if (existingRole) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = AppHelpers.ResponseMessages.ROLE_EXIST;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const role = await prisma.role.create({
        data: { name, description: description ?? null, status: status ?? true },
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.ROLE_CREATED;
      retData.data = role;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in createRole");
    }
  },

  list: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const roles = await prisma.role.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, description: true, status: true, createdAt: true, updatedAt: true },
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = roles.length
        ? AppHelpers.ResponseMessages.RECORDS_FOUND
        : AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
      retData.data = roles;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in listRoles");
    }
  },

  view: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    const { id } = req.params;

    try {
      const role = await prisma.role.findUnique({
        where: { id: parseInt(id) },
        select: { id: true, name: true, description: true, status: true, createdAt: true, updatedAt: true },
      });

      if (!role) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.ROLE_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.RECORDS_FOUND;
      retData.data = role;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in viewRole");
    }
  },

  update: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    const { id, name, description, status } = req.body;

    try {
      const existingRole = await prisma.role.findUnique({ where: { id: parseInt(id) } });
      if (!existingRole) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const updatedRole = await prisma.role.update({
        where: { id: parseInt(id) },
        data: {
          name: name ?? existingRole.name,
          description: description ?? existingRole.description,
          status: status ?? existingRole.status,
        },
        select: { id: true, name: true, description: true, status: true, createdAt: true, updatedAt: true },
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.ROLE_UPDATED;
      retData.data = updatedRole;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in updateRole");
    }
  },

  delete: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    const { roleId } = req.params;

    try {
      const existingRole = await prisma.role.findUnique({ where: { id: parseInt(roleId) } });
      if (!existingRole) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.ROLE_NOT_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      await prisma.role.delete({ where: { id: parseInt(roleId) } });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.ROLE_DELETED;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in deleteRole");
    }
  },

  changeStatus: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    const { id, status } = req.body;

    try {
      if (!id || typeof status !== "boolean") {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = AppHelpers.ResponseMessages.REQUIRED_PARAM_MISSING;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const existingRole = await prisma.role.findUnique({ where: { id: parseInt(id) } });
      if (!existingRole) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const updatedRole = await prisma.role.update({
        where: { id: parseInt(id) },
        data: { status },
        select: { id: true, name: true, description: true, status: true, updatedAt: true },
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.ROLE_UPDATED;
      retData.data = updatedRole;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in changeStatus");
    }
  },

};

module.exports = Controller;
