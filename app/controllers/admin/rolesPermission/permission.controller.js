const prisma = require("../../../models/index");
const AppHelpers = require("../../../helpers/index"); // Adjust path if needed

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

    try {
      const { name, moduleId, description } = req.body;

      const existing = await prisma.permission.findFirst({
        where: { name, moduleId },
      });

      if (existing) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = AppHelpers.ResponseMessages.PERMISSION_EXIST;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const permission = await prisma.permission.create({
        data: { name, moduleId, description },
        select: {
          id: true,
          name: true,
          moduleId: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.PERMISSION_CREATED;
      retData.data = permission;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR creating permission");
    }
  },

  list: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const permissions = await prisma.permission.findMany({
        include: { module: { select: { id: true, name: true } } },
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = permissions.length
        ? AppHelpers.ResponseMessages.RECORDS_FOUND
        : AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
      retData.data = permissions;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR listing permissions");
    }
  },

  view: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id } = req.params;

      const permission = await prisma.permission.findUnique({
        where: { id: Number(id) },
        include: { module: { select: { id: true, name: true } } },
      });

      if (!permission) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.RECORDS_FOUND;
      retData.data = permission;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR viewing permission");
    }
  },

  update: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id, name, moduleId, description } = req.body;

      const existing = await prisma.permission.findUnique({ where: { id: Number(id) } });
      if (!existing) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const updated = await prisma.permission.update({
        where: { id: Number(id) },
        data: { name, moduleId, description },
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.PERMISSION_UPDATED;
      retData.data = updated;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR updating permission");
    }
  },

  delete: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id } = req.params;

      const existing = await prisma.permission.findUnique({ where: { id: Number(id) } });
      if (!existing) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      await prisma.permission.delete({ where: { id: Number(id) } });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.PERMISSION_DELETE;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR deleting permission");
    }
  },

};

module.exports = Controller;
