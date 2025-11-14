const prisma = require("../../../models/index"); // Prisma client instance

const userHelper = {
  // Get admin profile data
  getSubAdminData: async (userId) => {
    try {
      const user = await prisma.admin.findUnique({
        where: { id: userId },
        select: {
          id: false,
          name: true,
          email: true,
          phone:true,
          address:true,
          country:true,
          state:true,
          city:true,
          user_type:true,
          status:true,
          password: true,
          roleId: true,
          createdAt: true,
          updatedAt:true,
          deletedAt:true
        },
      });

      if (!user) {
        throw new Error("Admin not found");
      }

      return {
        ...user
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
        id: false,
        name: true,
        email: true,
        phone:true,
        address:true,
        country:true,
        state:true,
        city:true,
        user_type:true,
        status:true,
        password: true,
        roleId: true,
        createdAt: true,
        updatedAt:true,
        deletedAt:true
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      ...user,
      //user_type: "user",
    };
  },
};

module.exports = userHelper;
