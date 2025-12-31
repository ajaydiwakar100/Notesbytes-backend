const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      allowUnknown: false, // only allow fields in schema
    });

    if (!error) {
      req.body = value; // ✅ use validated & sanitized data
      return next();
    }

    const message = error.details.map(i => i.message).join(', ');
    console.log("Joi error:", message);

    const retData = {
      status: "error",
      statusCode: 400,
      msg: message,
      data: [{ message }],
    };
    return res.status(retData.statusCode).json(retData);
  };
};

module.exports = validate;
