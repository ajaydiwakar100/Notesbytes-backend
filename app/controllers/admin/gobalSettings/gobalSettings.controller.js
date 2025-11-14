const prisma = require("../../../models/index");
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

  // Get all global settings
  getAllSettings: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    try {
      const settings = await prisma.globalSetting.findMany();
      if (!settings || settings.length === 0) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 200;
        retData.msg = AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
        retData.data = [];
        return AppHelpers.Utils.cRes(res, retData);
      }
      retData.data = settings;
      retData.msg = "success";
      retData.code = 200;
      retData.httpCode = 200;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in getAllSettings");
    }
  },

  // Create or update global setting
  saveSetting: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    let { id, key, value } = req.body;

    try {
      key = key.trim();
      value = value.trim();

      let setting;

      if (id) {
        // Update existing setting
        setting = await prisma.globalSetting.update({
          where: { id: Number(id) },
          data: { key, value },
        });
      } else {
        // Create new setting
        setting = await prisma.globalSetting.create({
          data: { key, value },
        });
      }

      retData.status = "success";
      retData.data = setting;
      retData.msg = AppHelpers.ResponseMessages.GLOBAL_SETTINGS_SUCCESS;
      retData.code = 200;
      retData.httpCode = 200;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in saveSetting");
    }
  },

  // Get single global setting
  editSetting: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    let { id } = req.body;

    try {
      if (!id) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 200;
        retData.msg = AppHelpers.ResponseMessages.SOMETHING_WENT_WORNG;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const setting = await prisma.globalSetting.findUnique({ where: { id: Number(id) } });
      if (!setting) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 200;
        retData.msg = AppHelpers.ResponseMessages.SOMETHING_WENT_WORNG;
        return AppHelpers.Utils.cRes(res, retData);
      }

      retData.msg = AppHelpers.ResponseMessages.GLOBAL_SETTINGS_SUCCESS;
      retData.data = setting;
      retData.code = 200;
      retData.httpCode = 200;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in editSetting");
    }
  },

  // Delete global setting
  deleteSetting: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    const { id } = req.body;

    try {
      await prisma.globalSetting.delete({ where: { id: Number(id) } });
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.DELETED_RECORD;
      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in deleteSetting");
    }
  },
};

module.exports = Controller;
