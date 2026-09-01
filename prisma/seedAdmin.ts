import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function seedAdmin() {
  const hashedPassword = await bcrypt.hash("Admin12345", 12);

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@fixitnow.com",
    },

    update: {
      name: "Super Admin",
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },

    create: {
      email: "admin@fixitnow.com",
      name: "Super Admin",
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("=================================");
  console.log("ADMIN SEEDED SUCCESSFULLY");
  console.log("=================================");
  console.log("ID:", admin.id);
  console.log("Name:", admin.name);
  console.log("Email:", admin.email);
  console.log("Role:", admin.role);
  console.log("Status:", admin.status);
}

seedAdmin()
  .catch((error) => {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });