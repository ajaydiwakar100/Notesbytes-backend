const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String,required: true,trim: true},
    email: { type: String, required: true,unique: true,lowercase: true,},
    password: { type: String,required: true,minlength: 6},
    phone: { type: String, required: true },
    userType: {type: String,default: "both"},
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, default: null },
    address: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: null },
    pincode: { type: String, default: null },
    profilePicture: { type: String, default: null },
    referralCode: { type: String, default: null },
    referredBy: { type: String, default: null },
    referralCommission: { type: Number, default: 0 },
    status: { type: Number,enum: [0, 1],default: 1}, // 0 = inactive, 1 = active
    token_version: { type: Number, default: 0 },
    consent:{type: String,default: "both"},
    preferredLanguage:{type: String,default: "both"},
    isProfileFill:{type: String,default: "No"},
    isSellerAccount:{type: String,default: "No"},
    razorpayFundAccountId:{type: String,default: null},
    razorpayCustomerId:{type: String,default: null},
    emailVerified: {type: Boolean,default: false},
    emailVerificationToken: {type: String,default: null },
    emailVerificationExpires: {type: Date,default: null },

  },
  { timestamps: true }
);
module.exports = mongoose.model("User", userSchema);