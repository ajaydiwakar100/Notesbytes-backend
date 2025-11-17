const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI;

    if (!dbURI) {
      console.error(" MONGO_URI not found in .env");
      process.exit(1);
    }

    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(" MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
