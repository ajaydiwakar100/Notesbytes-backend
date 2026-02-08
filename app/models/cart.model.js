const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
        quantity: { type: Number, default: 1 },
        addedAt: { type: Date, default: Date.now },
        sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", CartSchema);