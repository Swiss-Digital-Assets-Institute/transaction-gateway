import { PrismaClient } from '@prisma/client';
import { userData } from './seed-data';

const prisma = new PrismaClient();

async function userSeed() {
  await prisma.user.createMany({ data: userData });
  return prisma.user.findMany();
}

async function seed() {
  console.log('Running user seed...');
  await userSeed();
  console.log('Done✅');

  console.log('Finished✅✅✅');
}

seed().then(() => {
  process.exit(0);
});
