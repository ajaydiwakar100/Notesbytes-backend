const prisma = require("../../../models/index"); // Your Prisma client
const AppHelpers = require("../../../helpers/index"); // Assuming AppHelpers is CommonJS

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
      const { name, description } = req.body;

      const existingModule = await prisma.module.findUnique({ where: { name } });
      if (existingModule) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = AppHelpers.ResponseMessages.MODULE_EXIST;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const module = await prisma.module.create({
        data: { name, description },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.MODULE_CREATED;
      retData.data = module;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      console.error("Error in ModuleController.create:", err);
      return AppHelpers.Utils.cError(res, err);
    }
  },

  list: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const modules = await prisma.module.findMany({
        include: { permissions: true },
        orderBy: { createdAt: "desc" },
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = modules.length 
        ? AppHelpers.ResponseMessages.RECORDS_FOUND
        : AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
      retData.data = modules;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      console.error("Error in ModuleController.list:", err);
      return AppHelpers.Utils.cError(res, err);
    }
  },

  view: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id } = req.params;

      const module = await prisma.module.findUnique({
        where: { id: Number(id) },
        include: { permissions: true },
      });

      if (!module) {
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
      retData.data = module;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      console.error("Error in ModuleController.view:", err);
      return AppHelpers.Utils.cError(res, err);
    }
  },

  update: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id, name, description } = req.body;

      const existingModule = await prisma.module.findUnique({ where: { id: Number(id) } });
      if (!existingModule) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const updatedModule = await prisma.module.update({
        where: { id: Number(id) },
        data: { name, description },
        select: {
          id: true,
          name: true,
          description: true,
          updatedAt: true,
        },
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.MODULE_UPDATED;
      retData.data = updatedModule;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      console.error("Error in ModuleController.update:", err);
      return AppHelpers.Utils.cError(res, err);
    }
  },

  delete: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id } = req.params;

      const existingModule = await prisma.module.findUnique({ where: { id: Number(id) } });
      if (!existingModule) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      await prisma.module.delete({ where: { id: Number(id) } });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.MODULE_DELETE;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      console.error("Error in ModuleController.delete:", err);
      return AppHelpers.Utils.cError(res, err);
    }
  },

};

module.exports = Controller;
