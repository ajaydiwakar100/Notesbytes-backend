const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    category: {
      type: String,
      required: true
    },

    author: {
      type: String,
      required: true
    },

    readTime: {
      type: String, // "8 min read"
    },

    image: {
      type: String
    },

    content: {
      type: String, // HTML content
      required: true
    },

    tags: [
      {
        type: String
      }
    ],

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    },

    publishedAt: {
      type: Date
    }
  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

module.exports = mongoose.model("Blog", BlogSchema);
