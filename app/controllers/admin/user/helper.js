const Admin = require("../../../models/admin.model");
const userHelper = {
  // ---------------------------------------
  // Get Admin Profile Data
  // ---------------------------------------
  getAdminProfileData: async (userId) => {
    try {
      const user = await Admin.findById(userId)
        .select({
          _id: 0,       // exclude _id
          name: 1,
          email: 1,
          password: 1,
          roleId: 1,
          createdAt: 1
        })
        .lean();

      if (!user) {
        throw new Error("Admin not found");
      }

      return {
        ...user,
        user_type: "admin",
        isLoggedIn: "true",
      };
    } catch (err) {
      throw err;
    }
  },

  // ---------------------------------------
  // Get All Users (App Users)
  // ---------------------------------------
  getAllUsers: async () => {
    try {
      const users = await AppUser.find().lean();
      return users;
    } catch (err) {
      throw err;
    }
  },

  // ---------------------------------------
  // Get Profile Data for App User
  // ---------------------------------------
  getProfileData: async (userId) => {
    try {
      const user = await AppUser.findById(userId)
        .select({
          _id: 1,
          country_code: 1,
          phone_number: 1,
          password: 1,
          email: 1,
          nif: 1,
          patent_number: 1,
          first_name: 1,
          last_name: 1,
          dob: 1,
          addressDetails: 1,
          is_admin_verified: 1,
          kycFileNames: 1,
          account_id: 1,
          is_name_approved: 1,
          current_balance: 1,
          createdAt: 1,
          is_kyc_approved: 1,
          is_name_update: 1,
          is_block_user: 1,
        })
        .lean();

      if (!user) {
        throw new Error("User not found");
      }

      return {
        ...user,
        user_type: "user",
      };
    } catch (err) {
      throw err;
    }
  },
};

module.exports = userHelper;
