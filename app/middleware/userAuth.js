const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    // ✅ Read token from cookie
    const token = req.cookies?.userAuthToken;

    if (!token) {
      return res.status(401).json({
        status: "error",
        msg: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded.data → because you signed { data }
    req.user = decoded.data;

    next();
  } catch (err) {
    return res.status(401).json({
      status: "error",
      msg: "Invalid or expired token",
    });
  }
};
