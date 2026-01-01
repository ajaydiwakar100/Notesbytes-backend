const { Module,Permission } = require("../../../models/index.js");
const AppHelpers = require("../../../helpers/index");

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

      const existingModule = await Module.findOne({ name });
      if (existingModule) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = AppHelpers.ResponseMessages.MODULE_EXIST;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const module = await Module.create({ name, description });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.MODULE_CREATED;
      retData.data = module;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      console.error("Error in ModuleController.create:", err);
      return Controller.handleError(res, err);
    }
  },

  list: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      // Fetch modules and populate permissions
      const modules = await Module.find()
        .sort({ createdAt: -1 })
        .lean(); // .lean() returns plain JS objects

      // Attach permissions for each module
      const modulesWithPermissions = await Promise.all(
        modules.map(async (module) => {
          const permissions = await Permission.find({ moduleId: module._id }).sort({ createdAt: 1 }).lean();
          return {
            ...module,
            permissions,
          };
        })
      );

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = modulesWithPermissions.length
        ? AppHelpers.ResponseMessages.RECORDS_FOUND
        : AppHelpers.ResponseMessages.NO_RECORDS_FOUND;

      retData.data = modulesWithPermissions;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      console.error("Error in ModuleController.list:", err);
      return Controller.handleError(res, err);
    }
  },

  view: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id } = req.params;

      const module = await Module.findById(id);
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
      return Controller.handleError(res, err);
    }
  },

  update: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id, name, description } = req.body;

      const existingModule = await Module.findById(id);
      if (!existingModule) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const updatedModule = await Module.findByIdAndUpdate(
        id,
        { name, description },
        { new: true }
      );

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.MODULE_UPDATED;
      retData.data = updatedModule;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      console.error("Error in ModuleController.update:", err);
      return Controller.handleError(res, err);
    }
  },

  delete: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id } = req.params;

      const existingModule = await Module.findById(id);
      if (!existingModule) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      await Module.findByIdAndDelete(id);

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.MODULE_DELETE;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      console.error("Error in ModuleController.delete:", err);
      return Controller.handleError(res, err);
    }
  },
};

module.exports = Controller;
