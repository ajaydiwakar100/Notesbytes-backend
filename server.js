// server.js

import express, { json, urlencoded } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { PrismaClient } from "./app/generated/prisma/index.js";
import lodash from "lodash";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import * as AppHelpers from "./app/helpers/index.js";


// Initialize Express and Prisma
const app = express();
const prisma = new PrismaClient();

// Global variables
global._ = lodash;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
global.VIEW_PATH = join(__dirname, "views");
global.AppHelpers = AppHelpers;

// Load .env variables
dotenv.config();

// Security headers
app.use(helmet());
app.disable("x-powered-by");

// Logger
app.use(logger("dev"));

// CORS settings
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "User-Agent",
      "Cache-Control",
      "Postman-Token",
      "Authorization",
      "stripe-signature",
    ],
  })
);

// Body parsers
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());

// Connect Prisma
(async () => {
  try {
    await prisma.$connect();
    console.log(" Connected to Prisma database");
  } catch (err) {
    console.error("Cannot connect to the database:", err);
    process.exit(1);
  }
})();

//  Simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Prixy application." });
});

//  Load routes (keep them same as before)
import adminRoutes from "./app/routes/admin.routes.js";
adminRoutes(app);

//  Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// Graceful shutdown for Prisma
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("\n🧹 Prisma disconnected gracefully");
  process.exit(0);
});
