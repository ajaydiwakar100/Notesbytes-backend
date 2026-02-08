const mongoose = require("mongoose");
const RevenueSchema = new mongoose.Schema({
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
  totalAmount: Number,
  adminCommission: Number,
  sellerAmount: Number,
  commissionPercent: Number,
  payoutId: String,
  status: {
    type: String,
    enum: ["PENDING", "PROCESSING", "SETTLED", "FAILED"],
    default: "PENDING",
  },
},{ timestamps: true });

module.exports = mongoose.model("Revenue", RevenueSchema);
