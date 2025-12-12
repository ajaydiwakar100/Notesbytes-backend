const Joi = require("joi");
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/); // MongoDB ObjectId

const documentSchemas = {

  // CREATE DOCUMENT VALIDATION
  create: Joi.object().keys({
    name: Joi.string().trim().required(),

    type: Joi.string()
      .valid("pdf", "docx")
      .required(),

    prize: Joi.number()
      .positive()
      .required(),

    file: Joi.string()
      .trim()
      .required(),

    uploadedBy: objectId.required(),

    noOfDownloads: Joi.number()
      .integer()
      .min(0)
      .default(0),

    rating: Joi.number()
      .integer()
      .min(0)
      .max(5)
      .default(0),

    notes: Joi.string()
      .allow("", null)
      .optional(),

    status: Joi.number()
      .valid(0, 1)
      .default(1),

    approvalStatus: Joi.string()
      .valid("pending", "approved", "rejected")
      .default("pending"),

    fileSize: Joi.number().optional(),

    fileMimeType: Joi.string().optional(),

    downloadedBy: Joi.array().items(objectId).optional(),

    reviews: Joi.array()
      .items(
        Joi.object({
          user: objectId.required(),
          rating: Joi.number().min(1).max(5).required(),
          comment: Joi.string().allow("", null),
          createdAt: Joi.date().optional(),
        })
      )
      .optional(),

    // Uploaded file (multer)
    file: Joi.any().optional(),
  }),

  
  // UPDATE DOCUMENT VALIDATION
  update: Joi.object().keys({
    name: Joi.string().trim().optional(),

    type: Joi.string()
      .valid("pdf", "docx")
      .optional(),

    prize: Joi.number()
      .positive()
      .optional(),

    filePath: Joi.string()
      .trim()
      .optional(),

    uploadedBy: objectId.optional(),

    noOfDownloads: Joi.number()
      .integer()
      .min(0)
      .optional(),

    rating: Joi.number()
      .integer()
      .min(0)
      .max(5)
      .optional(),

    notes: Joi.string()
      .allow("", null)
      .optional(),

    status: Joi.number()
      .valid(0, 1)
      .optional(),

    approvalStatus: Joi.string()
      .valid("pending", "approved", "rejected")
      .optional(),

    fileSize: Joi.number().optional(),

    fileMimeType: Joi.string().optional(),

    downloadedBy: Joi.array().items(objectId).optional(),

    reviews: Joi.array()
      .items(
        Joi.object({
          user: objectId.required(),
          rating: Joi.number().min(1).max(5).required(),
          comment: Joi.string().allow("", null),
          createdAt: Joi.date().optional(),
        })
      )
      .optional(),

    file: Joi.any().optional(),
  }),
};

module.exports = documentSchemas ;
