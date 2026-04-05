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

// controllers/emailTemplate.controller.js
exports.getEmailTemplates = async (req, res) => {
  const retData = AppHelpers.Utils.responseObject();

  try {
    const templates = await EmailTemplate.find({})
      .sort({ createdAt: -1 });

    retData.status = "success";
    retData.code = 200;
    retData.msg = "Email template list fetched successfully";
    retData.data = templates;

    return AppHelpers.Utils.cRes(res, retData);

  } catch (error) {
    console.error("Get Email Templates Error:", error);

    retData.status = "error";
    retData.code = 500;
    retData.msg = "Failed to fetch email templates";
    retData.data = [{ details: error.message }];

    return AppHelpers.Utils.cRes(res, retData);
  }
};

// --------------------------------------------------------
// GET SINGLE EMAIL TEMPLATE DETAILS API
// --------------------------------------------------------
exports.getEmailTemplateDetails = async (req, res) => {
  const retData = AppHelpers.Utils.responseObject();

  try {
    const { id } = req.params;

    const template = await EmailTemplate.findById(id);

    if (!template) {
      retData.status = "error";
      retData.code = 404;
      retData.msg = "Email template not found";

      return AppHelpers.Utils.cRes(res, retData);
    }

    retData.status = "success";
    retData.code = 200;
    retData.msg = "Email template details fetched successfully";
    retData.data = template;

    return AppHelpers.Utils.cRes(res, retData);
  } catch (error) {
    console.error("Get Email Template Details Error:", error);

    retData.status = "error";
    retData.code = 500;
    retData.msg = "Failed to fetch email template details";
    retData.data = [{ details: error.message }];

    return AppHelpers.Utils.cRes(res, retData);
  }
};

// --------------------------------------------------------
// UPDATE EMAIL TEMPLATE API
// --------------------------------------------------------
exports.updateEmailTemplate = async (req, res) => {
  const retData = AppHelpers.Utils.responseObject();

  try {
    const { id } = req.params;
    const { key, subject, body, isActive } = req.body;

    const template = await EmailTemplate.findById(id);

    if (!template) {
      retData.status = "error";
      retData.code = 404;
      retData.msg = "Email template not found";

      return AppHelpers.Utils.cRes(res, retData);
    }

    template.key = key || template.key;
    template.subject = subject || template.subject;
    template.body = body || template.body;

    if (typeof isActive !== "undefined") {
      template.isActive = isActive;
    }

    await template.save();

    retData.status = "success";
    retData.code = 200;
    retData.msg = "Email template updated successfully";
    retData.data = template;

    return AppHelpers.Utils.cRes(res, retData);
  } catch (error) {
    console.error("Update Email Template Error:", error);

    retData.status = "error";
    retData.code = 500;
    retData.msg = "Failed to update email template";
    retData.data = [{ details: error.message }];

    return AppHelpers.Utils.cRes(res, retData);
  }
};