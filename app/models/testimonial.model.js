const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    status: { type: Number, enum: [0, 1], default: 1 } // inactive / active
  },
  { timestamps: true }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
