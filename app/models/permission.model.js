const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
    description: { type: String, default: null },

    // NEW FIELD
    status: {
      type: Number,
      enum: [0, 1],  // 0 = inactive, 1 = active
      default: 1,
    }
  },
  {
    timestamps: true,
    collection: "permissions"
  }
);

module.exports = mongoose.model("permission", permissionSchema);
