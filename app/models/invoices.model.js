const mongoose = require("mongoose");

const customerInvoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    gateway: {
      type: String,
      required: true,
      trim: true,
    },

    orderId: {
      type: String,
      required: true, 
      trim: true,
    },

    paymentId: {
      type: String,  
      default: null,
      trim: true
    },

    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    receipt: {
      type: String,
      default: null,
      trim: true
    },

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "INR"
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING"
    },

    notes: {
      type: String,
      default: null
    },

    billingName: {
      type: String,
      default: null,
      trim: true
    },

    billingEmail: {
      type: String,
      default: null,
      trim: true
    },

    billingPhone: {
      type: String,
      default: null,
      trim: true
    },

    billing_address: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true  // creates createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model("Invoice", customerInvoiceSchema);
