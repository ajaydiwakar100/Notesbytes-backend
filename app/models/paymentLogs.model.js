const mongoose = require("mongoose");

const customerPaymentLogSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    gateway: {
      type: String,
      required: true,
      trim: true,
    },

    orderId: {
      type: String,
      required: false,
      trim: true,
      default:null
    },

    paymentId: {
      type: String,
      default: null,
      trim: true,
    },

    eventType: {
      type: String,
      required: true, // order_created, payment_success, payment_failed, webhook etc.
      trim: true,
    },

    amount: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    signature: {
      type: String,
      default: null,
    },

    logData: {
      type: Object, // stores full webhook payload or order response
      default: {},
    },

    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

module.exports = mongoose.model("PaymentLog", customerPaymentLogSchema);
