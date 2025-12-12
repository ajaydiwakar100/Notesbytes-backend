const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
    },

    userType: {
      type: String,
      enum: ["buyer","seller"],
      default: "buyer",
    },

    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    pincode: { type: String },
    profilePicture: { type: String },
    referralCode: { type: String }, 
    referredBy: { type: String, default: null}, 
    referralCommission: { type: Number, default: 0 },

    // 0 = inactive, 1 = active
    status: { 
      type: Number, 
      enum: [0, 1],  // 0 = inactive, 1 = active
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
