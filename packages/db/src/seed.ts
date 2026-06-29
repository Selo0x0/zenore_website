import 'dotenv/config';
import { createPrismaClient, ProductStatus } from './index.ts';

const prisma = createPrismaClient();

const categories = [
  {
    name: 'Cüzdan',
    slug: 'cuzdan',
    description: 'Deri cüzdan ve kartlık koleksiyonu.',
    sortOrder: 10,
  },
  {
    name: 'Çanta',
    slug: 'canta',
    description: 'Günlük kullanıma uygun deri çantalar.',
    sortOrder: 20,
  },
  {
    name: 'Ofis Malzemeleri',
    slug: 'ofis-malzemeleri',
    description: 'Çalışma alanları için deri ofis ürünleri.',
    sortOrder: 30,
  },
  {
    parentSlug: 'ofis-malzemeleri',
    name: 'Deri Kalemlik',
    slug: 'deri-kalemlik',
    description: 'Masa ve çanta içi kullanım için deri kalemlikler.',
    sortOrder: 10,
  },
  {
    parentSlug: 'ofis-malzemeleri',
    name: 'Mouse Pad',
    slug: 'mouse-pad',
    description: 'Deri mouse pad modelleri.',
    sortOrder: 20,
  },
  {
    parentSlug: 'ofis-malzemeleri',
    name: 'Masa Matı',
    slug: 'masa-mati',
    description: 'Çalışma masaları için deri masa matları.',
    sortOrder: 30,
  },
  {
    name: 'Saat Kordonu',
    slug: 'saat-kordonu',
    description: 'Deri saat kordonları.',
    sortOrder: 40,
  },
  {
    name: 'Apple Aksesuar',
    slug: 'apple-aksesuar',
    description: 'Apple cihazlar için deri aksesuarlar.',
    sortOrder: 50,
  },
  {
    parentSlug: 'apple-aksesuar',
    name: 'Apple Watch Kordonu',
    slug: 'apple-watch-kordonu',
    description: 'Apple Watch için deri kordonlar.',
    sortOrder: 10,
  },
  {
    parentSlug: 'apple-aksesuar',
    name: 'iPhone Kılıf',
    slug: 'iphone-kilif',
    description: 'iPhone modelleri için deri kılıflar.',
    sortOrder: 20,
  },
  {
    parentSlug: 'apple-aksesuar',
    name: 'MacBook Kılıf',
    slug: 'macbook-kilif',
    description: 'MacBook modelleri için deri kılıflar.',
    sortOrder: 30,
  },
  {
    parentSlug: 'apple-aksesuar',
    name: 'AirPods Kılıf',
    slug: 'airpods-kilif',
    description: 'AirPods modelleri için deri kılıflar.',
    sortOrder: 40,
  },
  {
    name: 'Aksesuar',
    slug: 'aksesuar',
    description: 'Deri günlük kullanım aksesuarları.',
    sortOrder: 60,
  },
  {
    parentSlug: 'aksesuar',
    name: 'Gözlük Kılıfı',
    slug: 'gozluk-kilifi',
    description: 'Deri gözlük kılıfları.',
    sortOrder: 10,
  },
  {
    parentSlug: 'aksesuar',
    name: 'Deri Saat Kutusu',
    slug: 'deri-saat-kutusu',
    description: 'Saat saklama ve taşıma için deri kutular.',
    sortOrder: 20,
  },
  {
    name: 'Peç',
    slug: 'pec',
    description: 'Deri peç ürünleri.',
    sortOrder: 70,
  },
];

const products = [
  {
    categorySlug: 'cuzdan',
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
    variants: [
      {
        name: 'Kahverengi',
        sku: 'ZEN-WALLET-CLASSIC-BROWN',
        colorName: 'Kahverengi',
        colorHex: '#6B4226',
        material: 'Hakiki deri',
        priceKurus: 149990,
        stockQuantity: 12,
        isDefault: true,
        sortOrder: 0,
        attributes: {
          cardSlots: 6,
          finish: 'Classic grain',
        },
      },
    ],
  },
  {
    categorySlug: 'cuzdan',
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
    variants: [
      {
        name: 'Siyah',
        sku: 'ZEN-CARD-HOLDER-SLIM-BLACK',
        colorName: 'Siyah',
        colorHex: '#1F1F1F',
        material: 'Hakiki deri',
        priceKurus: 89990,
        stockQuantity: 20,
        isDefault: true,
        sortOrder: 0,
        attributes: {
          cardSlots: 4,
          profile: 'Slim',
        },
      },
    ],
  },
  {
    categorySlug: 'aksesuar',
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
    variants: [
      {
        name: 'Kahverengi / 110 cm',
        sku: 'ZEN-BELT-BRAIDED-BROWN-110',
        colorName: 'Kahverengi',
        colorHex: '#7A4A2A',
        size: '110 cm',
        material: 'Hakiki deri',
        priceKurus: 129990,
        stockQuantity: 8,
        isDefault: true,
        sortOrder: 0,
        attributes: {
          buckle: 'Metal',
          style: 'Braided',
        },
      },
    ],
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        isVisible: true,
        parentId: null,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: category.sortOrder,
        isVisible: true,
      },
    });
  }

  for (const category of categories.filter((category) => category.parentSlug)) {
    await prisma.category.update({
      where: {
        slug: category.slug,
      },
      data: {
        parent: {
          connect: {
            slug: category.parentSlug,
          },
        },
      },
    });
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        slug: product.slug,
      },
      update: {
        category: {
          connect: {
            slug: product.categorySlug,
          },
        },
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
        variants: {
          deleteMany: {},
          create: product.variants,
        },
      },
      create: {
        category: {
          connect: {
            slug: product.categorySlug,
          },
        },
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
        variants: {
          create: product.variants,
        },
      },
    });
  }

  console.info(`Seeded ${categories.length} categories.`);
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
