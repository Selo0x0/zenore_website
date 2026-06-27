import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.ts';

export { Prisma, ProductStatus } from '../generated/prisma/client.ts';
export type { Product } from '../generated/prisma/client.ts';

export function createPrismaClient(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to create a Prisma client.');
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export type ZenorePrismaClient = ReturnType<typeof createPrismaClient>;