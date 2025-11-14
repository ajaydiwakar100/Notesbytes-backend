// app/helpers/error-log.helper.js
const ErrorLogger = function(msg, errObject) {
    // TODO
    // Write the error to db or any file if required for tracking
    // ...

    // As of now log to console
    console.log(msg, errObject);
};

module.exports = ErrorLogger;
