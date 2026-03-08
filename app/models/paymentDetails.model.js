const mongoose = require("mongoose");

const paymentDetailsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Bank Details (Optional)
    accountHolderName: { type: String },
    accountHolderPhoneNumber: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String },

    // UPI (Optional)
    upiId: { type: String },

    // Consent (Optional but recommended)
    consentAccepted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Custom validation: At least Bank OR UPI required
paymentDetailsSchema.pre("save", function (next) {
  const hasBankDetails =
    this.accountHolderName ||
    this.accountNumber ||
    this.ifscCode;

  const hasUpi = this.upiId;

  if (!hasBankDetails && !hasUpi) {
    return next(new Error("At least Bank details or UPI ID must be provided."));
  }

  next();
});

module.exports = mongoose.model("PaymentDetails", paymentDetailsSchema);