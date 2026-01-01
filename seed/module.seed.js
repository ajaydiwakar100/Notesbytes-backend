require("dotenv").config();
const connectDB = require("../config/db");
const { Module } = require("../app/models/index"); // destructure Module

const seedModules = async () => {
  await connectDB();

  const modules = [
    { name: "Dashboard", description: "Main Dashboard" },
    { name: "Buyers", description: "Manage Buyers" },
    { name: "Sellers", description: "Manage Sellers " },
    { name: "Roles & Permission", description: "Manage Roles and Permissions" },
    { name: "Sub Admins", description: "Manage Sub Admin Users" },
    { name: "Email Template", description: "Manage Email Templates" },
    { name: "Global Settings", description: "Application Global Settings" },
  ];

  // Clear existing modules
  await Module.deleteMany({});
  // Insert seed data
  await Module.insertMany(modules);

  console.log("🌱 Modules seeded successfully");
  process.exit();
};

seedModules();
