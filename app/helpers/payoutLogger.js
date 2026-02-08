const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");

const logDir = path.join(__dirname, "../logs");
const payoutLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // 📄 Daily rotating file
    new DailyRotateFile({
      filename: `${logDir}/payout-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),

    // 🖥 Console (optional, useful in dev)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

module.exports = payoutLogger;