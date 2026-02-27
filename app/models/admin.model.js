const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },

    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },

    password: { 
      type: String, 
      required: true 
    },

    roleId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Role", 
      required: false 
    },

    // OTP
    otp_code: { 
      type: String, 
      default: null 
    },

    otp_expires_at: { 
      type: Date, 
      default: null 
    },

    // Token version (JWT invalidation)
    token_version: { 
      type: Number, 
      default: 0 
    },

    address: { 
      type: String, 
      default: null
    },

    city: { 
      type: String, 
      default: null 
    },

    state: { 
      type: String, 
      default: null 
    },

    country: { 
      type: String, 
      default: null 
    },

    phone: { 
      type: String, 
      default: null 
    },

    // 0 = inactive, 1 = active
    status: { 
      type: Number, 
      enum: [0, 1],  // 0 = inactive, 1 = active
      default: 1,
    },

    // admin | buyers | sellers
    user_type: { 
      type: String, 
      default: "admin" 
    },

    is_password_reset: { 
      type: Boolean, 
      default: false 
    },

    last_login: {
      type: Date,
      default: null
    },

    reset_token:{  
      type: String,
      default: null 
    },  
    
    reset_token_expiry :{  
      type: Date,
      default: null 
    },  

  },
  {
    timestamps: true,
    collection: "admins",
  }
);

module.exports = mongoose.model("admin", adminSchema);
