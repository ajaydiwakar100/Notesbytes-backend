const validate = (schema, property) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    const valid = error == null;

    if (valid) {
      next();
    } else {
      const { details } = error;
      const message = details.map(i => i.message).join(',');

      console.log("Joi error", message);
      console.log(error);

      const retData = {
        status: "error",
        statusCode: 400,
        msg: message,
        data: [{ message: message }]
      };
      res.status(retData.statusCode).json(retData);
    }
  };
};

module.exports = validate;
