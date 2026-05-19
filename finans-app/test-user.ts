import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.kullanici.findUnique({ where: { email: 'ilkcankopar1903@gmail.com' } });
  console.log("User:", user);
}
main().catch(console.error).finally(() => prisma.$disconnect());
