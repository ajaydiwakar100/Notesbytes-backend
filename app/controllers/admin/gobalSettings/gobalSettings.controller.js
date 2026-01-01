const {GlobalSetting} = require("../../../models/index");
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

  /**
   * ================================
   * GET GLOBAL SETTINGS (Single Form)
   * ================================
   */
  getSettings: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    try {
      const settings = await GlobalSetting.find({});

      // Convert key/value rows → object
      const formatted = {};
      settings.forEach(item => {
        formatted[item.key] = item.value;
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = "success";
      retData.data = formatted;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in getSettings");
    }
  },

  /**
   * ================================
   * SAVE GLOBAL SETTINGS (Single Form)
   * ================================
   */
  saveSettings: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const payload = req.body;

      if (!payload || Object.keys(payload).length === 0) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 200;
        retData.msg = AppHelpers.ResponseMessages.SOMETHING_WENT_WORNG;
        return AppHelpers.Utils.cRes(res, retData);
      }

      // SIMPLE INSERT / UPDATE LOGIC
      for (const key in payload) {
        await GlobalSetting.updateOne(
          { key },
          { $set: { value: String(payload[key]) } },
          { upsert: true }
        );
      }

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.GLOBAL_SETTINGS_SUCCESS;

      return AppHelpers.Utils.cRes(res, retData);
    } catch (err) {
      return Controller.handleError(res, err, "ERROR in saveSettings");
    }
  },

  /**
   * ================================
   * DELETE SINGLE SETTING (OPTIONAL)
   * ================================
   */
  deleteSetting: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();
    const { key } = req.body;

    try {
      await GlobalSetting.deleteOne({ key });

      retData.status = "success";
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
