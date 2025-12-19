const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    // Basic Info
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    shortDescription: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, index: true},
    
    // Pricing & Stats
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    noOfDownloads: { type: Number, default: 0 },

    // Author & Classification
    author: { type: String, trim: true },
    subject: { type: String, trim: true },
    exam: { type: String, trim: true },
    language: { type: String, trim: true },

    // Document Details
    pages: { type: Number },
    format: { type: String, enum: ["PDF", "DOCX"], default: "PDF" },
    lastUpdated: { type: String },

    // File Info
    filePath: { type: String, required: true, trim: true },
    fileSize: { type: Number },
    fileMimeType: { type: String },

    // Media
    docImage: { type: String, trim: true, default: "" },

    // Tags & Topics
    topics: [{ type: String }],
    highlights: [{ type: String }],
    tags: { type: String, trim: true },

    // Ownership
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    downloadedBy: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],

    // Reviews
    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ],

    // Status & Approval
    status: { type: Number, enum: [0, 1], default: 1 }, // inactive / active
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    rejectedReason: { type: String, default: null },
    rejectedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },

    // Feature Flag
    isFeature: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
