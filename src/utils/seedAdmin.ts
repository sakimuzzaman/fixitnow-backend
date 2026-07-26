import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdmin() {
  const hashedPassword = await bcrypt.hash('Admin12345', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fixitnow.com' },
    update: {},
    create: {
      email: 'admin@fixitnow.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    },
  });
  console.log('Admin seeded:', admin);
}

seedAdmin()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());