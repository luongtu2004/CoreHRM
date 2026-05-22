import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.count();
  const attendances = await prisma.attendance.findMany();
  console.log('Users:', users);
  console.log('Attendances:', attendances.length);
  console.log('Data:', attendances);
}
main().finally(() => prisma.$disconnect());
