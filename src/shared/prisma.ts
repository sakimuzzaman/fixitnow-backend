// import { PrismaClient } from '../../generated/prisma/client.js';

// const prisma = new PrismaClient({
//     accelerateUrl: process.env.PRISMA_ACCELERATE_URL!,
// });

// export default prisma;


import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

export default prisma;