const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "../../logs");

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

function writeLog(fileName, message) {

    const filePath = path.join(logsDir, fileName);

    const log = `[${new Date().toISOString()}] ${message}\n`;

    fs.appendFile(filePath, log, (err) => {
        if (err) {
            console.error("Logger Error:", err);
        }
    });
}

module.exports = {

    info(message) {
        writeLog("app.log", message);
    },

    payment(message) {
        writeLog("payment.log", message);
    },

    webhook(message) {
        writeLog("webhook.log", message);
    },

    error(message) {
        writeLog("error.log", message);
    }

};