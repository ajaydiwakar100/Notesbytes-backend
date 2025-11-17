const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: null },

    // 👇 New status field added
    status: {
      type: Number,
      enum: [0, 1],   // 0 = inactive, 1 = active
      default: 1
    }
  },
  {
    timestamps: true,
    collection: "modules",
  }
);

module.exports = mongoose.model("module", moduleSchema);
