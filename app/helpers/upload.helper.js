const multer = require("multer");
const fs = require("fs");
const path = require("path");

/**
 * Create dynamic multer uploader
 * @param {String} folderName - example: "documents", "profile", "posts"
 */
const createUploader = (folderName) => {

    const uploadDir = path.join(__dirname, `../../uploads/${folderName}`);

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        },
    });

    // 🔐 FILE VALIDATION
    const fileFilter = (req, file, cb) => {

        // Main document
        if (file.fieldname === "file") {
            if (
                file.mimetype === "application/pdf" ||
                file.mimetype.includes("word")
            ) {
                return cb(null, true);
            }
            return cb(new Error("Only PDF or DOCX files are allowed"));
        }

        // Document image
        if (file.fieldname === "docImage") {
            if (file.mimetype.startsWith("image/")) {
                return cb(null, true);
            }
            return cb(new Error("Only image files are allowed"));
        }

        cb(new Error("Unexpected field"));
    };

    return multer({ storage, fileFilter });
};

module.exports = createUploader;
