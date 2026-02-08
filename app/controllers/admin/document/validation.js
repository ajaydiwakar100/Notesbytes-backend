const Joi = require("joi");

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/); // MongoDB ObjectId

const documentSchemas = {

  // --------------------------------------------------
  // CREATE DOCUMENT / NOTES
  // --------------------------------------------------
  create: Joi.object({
    title: Joi.string().trim().required(),

    description: Joi.string()
      .allow("", null)
      .optional(),

    shortDescription: Joi.string()
      .allow("", null)
      .optional(),

    price: Joi.number()
      .positive()
      .required(),

    author: Joi.string()
      .trim()
      .optional(),

    subject: Joi.string()
      .trim()
      .optional(),

    exam: Joi.string()
      .trim()
      .optional(),

    originalPrice: Joi.string()
      .trim()
      .optional(),

    finalPrice: Joi.string()
      .trim()
      .optional(),

    language: Joi.string()
      .trim()
      .optional(),

    pages: Joi.number()
      .integer()
      .positive()
      .optional(),

    format: Joi.string()
      .default("PDF"),

    topics: Joi.array()
      .items(Joi.string().trim())
      .optional(),

    highlights: Joi.array()
      .items(Joi.string().trim())
      .optional(),

    //uploadedBy: objectId.required(),

    approvalStatus: Joi.string()
      .valid("pending", "approved", "rejected")
      .default("pending"),

    status: Joi.number()
      .valid(0, 1)
      .default(1),

    publishStatus: Joi.number()
      .valid(0, 1)
      .default(0),

    isFeature: Joi.boolean()
      .default(false),

    // These are auto-managed (do NOT send from client)
    noOfDownloads: Joi.number()
      .integer()
      .min(0)
      .default(0),

    rating: Joi.number()
      .min(0)
      .max(5)
      .default(0),

    reviewsCount: Joi.number()
      .integer()
      .min(0)
      .default(0)
  }),

  // --------------------------------------------------
  // UPDATE DOCUMENT / NOTES
  // --------------------------------------------------
  update: Joi.object({
    title: Joi.string().trim().optional(),

    description: Joi.string()
      .allow("", null)
      .optional(),

    price: Joi.number()
      .positive()
      .optional(),

    author: Joi.string()
      .trim()
      .optional(),

    subject: Joi.string()
      .trim()
      .optional(),

    exam: Joi.string()
      .trim()
      .optional(),

    language: Joi.string()
      .trim()
      .optional(),

    pages: Joi.number()
      .integer()
      .positive()
      .optional(),

    format: Joi.string()
      .optional(),

    topics: Joi.array()
      .items(Joi.string().trim())
      .optional(),

    highlights: Joi.array()
      .items(Joi.string().trim())
      .optional(),

    tags: Joi.string()
      .trim()
      .optional(),

    approvalStatus: Joi.string()
      .valid("pending", "approved", "rejected")
      .optional(),

    status: Joi.number()
      .valid(0, 1)
      .optional(),

    isFeature: Joi.boolean()
      .optional()
  })
};

module.exports = documentSchemas;
