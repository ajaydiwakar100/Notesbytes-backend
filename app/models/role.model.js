const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    permissionId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
    // status: 1 = active, 0 = inactive
    status: {
      type: Number,
      enum: [0, 1],
      default: 1
    }
  },
  {
    timestamps: true,
    collection: "roles",
  }
);

module.exports = mongoose.model("role", roleSchema);
