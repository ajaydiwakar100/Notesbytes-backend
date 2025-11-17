const JWT = require('jsonwebtoken');

/**
 * Generate JWT token
 */
const GenJWTToken = function (data, expiresIn = '6h') {
  try {
    if (!data || !data.id || !data.userType) {
      throw new Error("Invalid data for JWT");
    }

    // Support both camelCase and snake_case token version
    if (data.tokenVersion === undefined && data.token_version !== undefined) {
      data.tokenVersion = data.token_version;
    }

    const token = JWT.sign({ data }, process.env.JWT_SECRET, { expiresIn });
    return token;
  } catch (err) {
    console.error("Error in GenJWTToken:", err);
    throw err;
  }
};

/**
 * Decode JWT token
 */
const DecodeJWTToken = function (token) {
  if (!token) throw new Error("Token is required");

  try {
    return JWT.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    throw err;
  }
};

module.exports = { GenJWTToken, DecodeJWTToken };
