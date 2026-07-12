import 'dotenv/config';
import { createPrismaClient } from './index.ts';

const prisma = createPrismaClient();

// Removes everything created by seed-reviews.ts, identified by the
// zenore.internal marker domain. Run this before real production launch.
const SEED_EMAIL_DOMAIN = 'zenore.internal';

async function main() {
  const seedCustomers = await prisma.customer.findMany({
    where: { email: { endsWith: `@${SEED_EMAIL_DOMAIN}` } },
    select: { id: true },
  });
  const customerIds = seedCustomers.map((c) => c.id);

  const { count: reviewCount } = await prisma.review.deleteMany({
    where: { customerId: { in: customerIds } },
  });
  const { count: customerCount } = await prisma.customer.deleteMany({
    where: { id: { in: customerIds } },
  });

  console.info(`Deleted ${reviewCount} mock reviews.`);
  console.info(`Deleted ${customerCount} mock reviewer accounts.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
