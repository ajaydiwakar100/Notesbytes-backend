const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    // 👤 User who shared referral
    referrer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 👤 User who registered using referral
    referred_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One referral per user only
    },

    referral_code_used: {
      type: Boolean,
      required: true,
      trim: true,
      default:false,
    },

    // pending → registered but no purchase
    // completed → commission given
    // cancelled → refund/fraud
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },

    // Order related info (filled after first successful purchase)
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    order_amount: {
      type: Number,
      default: 0,
    },

    commission_percent: {
      type: Number,
      default: 5, // 5% default
    },

    commission_amount: {
      type: Number,
      default: 0,
    },

    // pending → not credited
    // paid → credited
    // reversed → refund case
    commission_status: {
      type: String,
      enum: ["pending", "paid", "reversed"],
      default: "pending",
    },

    is_first_purchase: {
      type: Boolean,
      default: true,
    },

    completed_at: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true,
    collection: "referrals",
  }
);

// Indexes (important for performance)
referralSchema.index({ referrer_id: 1 });
referralSchema.index({ referred_user_id: 1 });
referralSchema.index({ status: 1 });

module.exports = mongoose.model("referral", referralSchema);
