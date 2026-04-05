require("dotenv").config({ path: "../.env" });
const connectDB = require("../config/db");
const { Module } = require("../app/models/index"); // destructure Module

const seedModules = async () => {
  await connectDB();

  const modules = [
    { name: "Dashboard", description: "Main Dashboard" },

    { name: "User Management", description: "Manage all users" },
    { name: "Roles & Permission", description: "Manage roles and permissions" },

    { name: "Pages", description: "Manage website pages" },
    { name: "Home Page", description: "Manage home page content" },
    { name: "About Us", description: "Manage about us page" },
    { name: "Sell Notes", description: "Manage sell notes page" },
    { name: "Privacy Policy", description: "Manage privacy policy page" },
    { name: "Terms & Conditions", description: "Manage terms and conditions page" },
    { name: "Refund & Cancellation", description: "Manage refund and cancellation page" },

    { name: "Documents", description: "Manage documents section" },
    { name: "Purchase Document", description: "Manage purchase documents" },
    { name: "Uploaded Document", description: "Manage uploaded documents" },

    { name: "Revenues Info", description: "Manage revenue information" },
    { name: "Revenues", description: "View revenues list" },
    { name: "Summary Report", description: "View revenue summary report" },

    { name: "Blogs", description: "Manage blogs" },

    { name: "Sub Admins", description: "Manage sub admin users" },

    { name: "Email Template", description: "Manage email templates" },

    { name: "Global Settings", description: "Application global settings" }
  ];

  // Clear existing modules
  await Module.deleteMany({});
  // Insert seed data
  await Module.insertMany(modules);

  console.log("🌱 Modules seeded successfully");
  process.exit();
};

seedModules();
