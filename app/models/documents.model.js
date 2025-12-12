const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ["pdf", "docx"], default: "pdf" },
    prize: { type: Number, required: true },
    filePath: { type: String, required: true, trim: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    noOfDownloads: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    notes: { type: String, trim: true, default: "" },
    status: { type: Number, enum: [0, 1], default: 1 }, // inactive/active
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    rejectedReason: {type: String, trim: true, default: null},
    rejectedAt: {type: Date,default: null},
    approvedAt: {type: Date,default: null},
    fileSize: { type: Number },
    fileMimeType: { type: String },
    downloadedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reviews: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rating: Number,
      comment: String,
      createdAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
