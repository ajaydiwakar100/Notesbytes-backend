const multer = require("multer");
const fs = require("fs");
const path = require("path");

/**
 * Create dynamic multer uploader
 * @param {String} folderName - example: "documents", "profile", "posts"
 */
const createUploader = (folderName) => {

    // Build full path: /uploads/<folderName>
    const uploadDir = path.join(__dirname, `../../uploads/${folderName}`);

    // Create directory if missing
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

    return multer({ storage });
};

module.exports = createUploader;
