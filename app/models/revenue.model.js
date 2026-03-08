const mongoose = require("mongoose");

const RevenueSchema = new mongoose.Schema(
{
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PurchaseOrder",
    required: true,
  },

  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  totalAmount: {
    type: Number,
    default: 0,
  },

  adminCommission: {
    type: Number,
    default: 0,
  },

  sellerAmount: {
    type: Number,
    default: 0,
  },

  commissionPercent: {
    type: Number,
    default: 0,
  },

  payoutId: {
    type: String,
    default: null,
  },

  payoutType: {
    type: String,
    default: null,
  },

  paidAmount: {
    type: Number,
    default: 0,
  },

  paymentPaidDate: {
    type: Date,
    default: null,
  },

  status: {
    type: String,
    enum: ["PENDING", "PROCESSING", "SETTLED", "FAILED", "PARTIAL"],
    default: "PENDING",
  },
},
{ timestamps: true }
);

module.exports = mongoose.model("Revenue", RevenueSchema);