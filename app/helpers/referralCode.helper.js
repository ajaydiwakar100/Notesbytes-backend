const { User } = require("../models/index");

async function generateUniqueReferralCode(name) {
  // Step 1: take first 3 letters of name
  const prefix = name.substring(0, 3).toUpperCase();

  while (true) {
    // Step 2: generate random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    // Step 3: Combine prefix + number
    const referralCode = `${prefix}${randomNum}`;

    // Step 4: Check in DB if code already exists
    const exists = await User.findOne({ referralCode });

    if (!exists) {
      return referralCode; // unique → return it
    }

    // If exists → loop again and generate new code
  }
}

module.exports = generateUniqueReferralCode;
