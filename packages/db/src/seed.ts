import 'dotenv/config';
import { createPrismaClient, ProductStatus } from './index.ts';

const prisma = createPrismaClient();

const products = [
  {
    name: 'Classic Leather Wallet',
    slug: 'classic-leather-wallet',
    description: 'A compact leather wallet designed for daily use.',
    priceKurus: 149990,
    currency: 'TRY',
    stockQuantity: 12,
    status: ProductStatus.ACTIVE,
    images: [
      {
        url: '/uploads/products/classic-leather-wallet-1.webp',
        alt: 'Classic leather wallet front view',
        sortOrder: 0,
      },
      {
        url: '/uploads/products/classic-leather-wallet-2.webp',
        alt: 'Classic leather wallet open view',
        sortOrder: 1,
      },
    ],
  },
  {
    name: 'Slim Card Holder',
    slug: 'slim-card-holder',
    description: 'A minimal card holder with a slim pocket-friendly profile.',
    priceKurus: 89990,
    currency: 'TRY',
    stockQuantity: 20,
    status: ProductStatus.ACTIVE,
    images: [
      {
        url: '/uploads/products/slim-card-holder-1.webp',
        alt: 'Slim leather card holder front view',
        sortOrder: 0,
      },
    ],
  },
  {
    name: 'Braided Leather Belt',
    slug: 'braided-leather-belt',
    description: 'A durable braided leather belt for smart everyday styling.',
    priceKurus: 129990,
    currency: 'TRY',
    stockQuantity: 8,
    status: ProductStatus.ACTIVE,
    images: [
      {
        url: '/uploads/products/braided-leather-belt-1.webp',
        alt: 'Braided leather belt product view',
        sortOrder: 0,
      },
    ],
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: {
        slug: product.slug,
      },
      update: {
        name: product.name,
        description: product.description,
        priceKurus: product.priceKurus,
        currency: product.currency,
        stockQuantity: product.stockQuantity,
        status: product.status,
        images: {
          deleteMany: {},
          create: product.images,
        },
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        priceKurus: product.priceKurus,
        currency: product.currency,
        stockQuantity: product.stockQuantity,
        status: product.status,
        images: {
          create: product.images,
        },
      },
    });
  }

  console.info(`Seeded ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });