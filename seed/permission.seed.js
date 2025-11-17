require("dotenv").config();
const connectDB = require("../config/db");
const { Module, Permission } = require("../app/models/index"); // destructure models

const seedPermissions = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected...");

    // Fetch all modules
    const modules = await Module.find({});

    if (!modules.length) {
      console.log("No modules found. Please seed modules first.");
      process.exit(0);
    }

    const permissions = [];

    // Standard permissions for each module
    const permissionTypes = ["view", "add", "update", "delete"];

    modules.forEach((module) => {
      permissionTypes.forEach((type) => {
        permissions.push({
          name: type,
          moduleId: module._id,
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} ${module.name}`,
          status: true,
        });
      });
    });

    // Clear existing permissions
    await Permission.deleteMany({});
    // Insert seed permissions
    await Permission.insertMany(permissions);

    console.log("🌱 Permissions seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding permissions:", err);
    process.exit(1);
  }
};

seedPermissions();
