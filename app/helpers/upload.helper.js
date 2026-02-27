const multer = require("multer");
const fs = require("fs");
const path = require("path");

/**
 * Create dynamic multer uploader
 * @param {String} folderName - example: "document"
 */
const createUploader = (folderName) => {

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const userId = req.user?.id || req.body.uploadedBy;

      if (!userId) {
        return cb(new Error("User ID not found"), null);
      }

      let subFolder = "others";

      if (file.fieldname === "file") subFolder = "original";
      if (file.fieldname === "sampleFile") subFolder = "sample";
      if (file.fieldname === "docImage") subFolder = "thumbnail";

      const uploadDir = path.join(
        __dirname,
        `../../uploads/${folderName}/${userId}/${subFolder}`
      );

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      cb(null, uploadDir);
    },

    filename: function (req, file, cb) {
      const uniqueSuffix =
        Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  // 🔐 FILE VALIDATION
  const fileFilter = (req, file, cb) => {

    // ORIGINAL DOCUMENT
    if (file.fieldname === "file" || file.fieldname === "sampleFile") {
      if (
        file.mimetype === "application/pdf" ||
        file.mimetype === "application/zip" || // ZIP support
        file.mimetype === "application/x-zip-compressed" || // Windows ZIP
        file.mimetype.includes("word") ||
        file.mimetype.includes("presentation")
      ) {
        return cb(null, true);
      }
      return cb(new Error("Only PDF, DOC, DOCX, PPT files are allowed"));
    }

    // THUMBNAIL IMAGE
    if (file.fieldname === "docImage") {
      if (file.mimetype.startsWith("image/")) {
        return cb(null, true);
      }
      return cb(new Error("Only image files are allowed"));
    }

    cb(new Error("Unexpected field"));
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  });
};

module.exports = createUploader;
