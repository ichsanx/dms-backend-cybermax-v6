import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@mail.com';
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return;

  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: { email, password: passwordHash, role: Role.ADMIN },
  });
  console.log('Seeded admin:', email, 'password: admin123');
}

main().finally(() => prisma.$disconnect());
