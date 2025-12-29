// controllers/emailTemplate.controller.js
const {EmailTemplate} = require("../../../models/index.js");
const AppHelpers = require("../../../helpers/index.js");

exports.createEmailTemplate = async (req, res) => {
  const retData = AppHelpers.Utils.responseObject();

  try {
    const { key, subject, body, isActive } = req.body;

    if (!key || !subject || !body) {
      retData.status = "error";
      retData.code = 400;
      retData.msg = "Key, subject and body are required";
      return AppHelpers.Utils.cRes(res, retData);
    }

    // Prevent duplicate keys
    const existing = await EmailTemplate.findOne({ key });
    if (existing) {
      retData.status = "error";
      retData.code = 409;
      retData.msg = "Template key already exists";
      return AppHelpers.Utils.cRes(res, retData);
    }

    const template = await EmailTemplate.create({
      key,
      subject,
      body,
      isActive: isActive !== undefined ? isActive : true,
    });

    retData.status = "success";
    retData.code = 200;
    retData.msg = "Email template created successfully";
    retData.data = template;

    return AppHelpers.Utils.cRes(res, retData);
  } catch (error) {
    console.error("Create Email Template Error:", error);

    retData.status = "error";
    retData.code = 500;
    retData.msg = "Failed to create email template";
    retData.data = [{ details: error.message }];

    return AppHelpers.Utils.cRes(res, retData);
  }
};
