const Permission = require("../../../models/index");
const AppHelpers = require("../../../helpers/index");

const Controller = {
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
      const { name, moduleId, description, status } = req.body;

      // Check duplicate
      const existing = await Permission.findOne({ name, moduleId });
      if (existing) {
        retData.status = "error";
        retData.code = 400;
        retData.httpCode = 400;
        retData.msg = AppHelpers.ResponseMessages.PERMISSION_EXIST;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const permission = await Permission.create({
        name,
        moduleId,
        description,
        status
      });

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.PERMISSION_CREATED;
      retData.data = permission;
      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err);
    }
  },

  list: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const permissions = await Permission.find()
        .populate("moduleId", "name");

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = permissions.length
        ? AppHelpers.ResponseMessages.RECORDS_FOUND
        : AppHelpers.ResponseMessages.NO_RECORDS_FOUND;

      retData.data = permissions;
      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err);
    }
  },

  view: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id } = req.params;

      const permission = await Permission.findById(id)
        .populate("moduleId", "name");

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
      return Controller.handleError(res, err);
    }
  },

  update: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id, name, moduleId, description, status } = req.body;

      const existing = await Permission.findById(id);
      if (!existing) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      const updated = await Permission.findByIdAndUpdate(
        id,
        { name, moduleId, description, status },
        { new: true }
      );

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.PERMISSION_UPDATED;
      retData.data = updated;
      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err);
    }
  },

  delete: async (req, res) => {
    const retData = AppHelpers.Utils.responseObject();

    try {
      const { id } = req.params;

      const existing = await Permission.findById(id);
      if (!existing) {
        retData.status = "error";
        retData.code = 404;
        retData.httpCode = 404;
        retData.msg = AppHelpers.ResponseMessages.NO_RECORDS_FOUND;
        return AppHelpers.Utils.cRes(res, retData);
      }

      await Permission.findByIdAndDelete(id);

      retData.status = "success";
      retData.code = 200;
      retData.httpCode = 200;
      retData.msg = AppHelpers.ResponseMessages.PERMISSION_DELETE;
      return AppHelpers.Utils.cRes(res, retData);

    } catch (err) {
      return Controller.handleError(res, err);
    }
  }

};

module.exports = Controller;
