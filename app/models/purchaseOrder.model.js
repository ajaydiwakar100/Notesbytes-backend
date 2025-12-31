const mongoose = require("mongoose");

const PurchaseOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    amount: {
      type: Number, // INR amount (e.g. 2500)
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["CREATED", "PAID", "CANCELLED"],
      default: "CREATED",
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Document",
          required: true,
        },

        title: {
          type: String,
          required: true,
        },

        price: {
          type: Number, // snapshot price at purchase time
          required: true,
        },

        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

module.exports = mongoose.model("PurchaseOrder", PurchaseOrderSchema);
