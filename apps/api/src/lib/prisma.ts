import { PrismaClient } from '@prisma/client';
import { isProd } from '../config/env.js';

export const prisma = new PrismaClient({
  log: isProd ? ['error'] : ['query', 'warn', 'error'],
});

export async function tutupPrisma() {
  await prisma.$disconnect();
}
