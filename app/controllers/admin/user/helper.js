const prisma = require("../../../models/index.js");

const userHelper = {
  // Get admin profile data
  getAdminProfileData: async (userId) => {
    try {
      const user = await prisma.admin.findUnique({
        where: { id: userId },
        select: {
          id: false,          // exclude id (similar to "_id": 0)
          name: true,
          email: true,
          password: true,
          roleId: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new Error("Admin not found");
      }

      return {
        ...user,
        user_type: "admin",
        isLoggedIn: "true",
      };
    } catch (error) {
      throw error;
    }
  },

  // Get all app users
  getAllUsers: async () => {
    const users = await prisma.appUser.findMany();
    return users;
  },

  // Get app user profile data
  getProfileData: async (userId) => {
    const user = await prisma.appUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        country_code: true,
        phone_number: true,
        password: true,
        email: true,
        nif: true,
        patent_number: true,
        first_name: true,
        last_name: true,
        dob: true,
        addressDetails: true,
        is_admin_verified: true,
        kycFileNames: true,
        account_id: true,
        is_name_approved: true,
        current_balance: true,
        createdAt: true,
        is_kyc_approved: true,
        is_name_update: true,
        is_block_user: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      ...user,
      user_type: "user",
    };
  },
};

module.exports = userHelper;
