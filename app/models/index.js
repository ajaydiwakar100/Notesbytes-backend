const { PrismaClient } = require('../generated/prisma'); // point to index.js

const prisma = new PrismaClient();

module.exports = prisma;
