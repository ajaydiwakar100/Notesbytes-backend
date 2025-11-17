// server.js

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const lodash = require("lodash");
const path = require("path");
const mongoose = require("mongoose");

// Load .env
dotenv.config();

const app = express();

// Global
global._ = lodash;
global.AppHelpers = require("./app/helpers");

// Paths
global.VIEW_PATH = path.join(__dirname, "views");

/* ---------------------------
   MONGO DB CONNECTION
----------------------------*/
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "notebytes",
  })
  .then(() => console.log("🟢 MongoDB connected"))
  .catch((err) => {
    console.error("🔴 MongoDB connection error:", err);
    process.exit(1);
  });

/* ---------------------------
   MIDDLEWARES
----------------------------*/
app.use(helmet());
app.disable("x-powered-by");
app.use(logger("dev"));
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ---------------------------
   ROUTES
----------------------------*/
app.get("/", (req, res) => {
  res.json({ message: "Welcome to notebytes application." });
});

// Import admin routes (CommonJS)
const adminRoutes = require("./app/routes/admin.routes");
adminRoutes(app);

/* ---------------------------
   START SERVER
----------------------------*/
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
