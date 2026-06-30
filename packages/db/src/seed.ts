import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
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

type ManifestImage = {
  filename: string;
  sourceFile: string;
};

type ManifestProduct = {
  categorySlug: string;
  categoryName: string;
  productSlug: string;
  suggestedName: string;
  sourceFolder: string;
  images: ManifestImage[];
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, '../..');
const manifestPath = resolve(packageRoot, 'src/data/product-photos.manifest.json');

function loadManifest(): ManifestProduct[] {
  try {
    const raw = readFileSync(manifestPath, 'utf-8');
    return JSON.parse(raw) as ManifestProduct[];
  } catch {
    throw new Error(
      `Could not read product photo manifest at ${manifestPath}. Run "npm run import-photos -w packages/db" first.`,
    );
  }
}

const leatherColors = [
  { name: 'Kahverengi', hex: '#6B4226' },
  { name: 'Siyah', hex: '#1F1F1F' },
  { name: 'Taba', hex: '#A0522D' },
  { name: 'Bordo', hex: '#5C1A1A' },
  { name: 'Lacivert', hex: '#1B2A4A' },
  { name: 'Antik Kahve', hex: '#7A4A2A' },
  { name: 'Krem', hex: '#E8DCC8' },
];

const nameAdjectives = ['Klasik', 'Modern', 'Şık', 'Günlük', 'Premium'];

const priceRangesTry: Record<string, [number, number]> = {
  cuzdan: [800, 1500],
  canta: [2000, 4000],
  'deri-kalemlik': [300, 600],
  'mouse-pad': [250, 450],
  'masa-mati': [400, 700],
  'saat-kordonu': [400, 700],
  'deri-saat-kutusu': [600, 1200],
  'gozluk-kilifi': [350, 600],
  'apple-watch-kordonu': [450, 750],
  'iphone-kilif': [500, 900],
  'macbook-kilif': [900, 1600],
  'airpods-kilif': [300, 500],
  pec: [200, 400],
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickColors(slug: string) {
  const hash = hashString(slug);
  const count = 2 + (hash % 2);

  return Array.from({ length: count }, (_, i) => leatherColors[(hash + i * 3) % leatherColors.length]);
}

function pickAdjective(slug: string) {
  const hash = hashString(`${slug}-adj`);
  return nameAdjectives[hash % nameAdjectives.length];
}

function priceForProduct(slug: string, range: [number, number]) {
  const [min, max] = range;
  const hash = hashString(`${slug}-price`);
  const steps = Math.floor((max - min) / 10) + 1;
  const tryAmount = min + (hash % steps) * 10;
  return tryAmount * 100 - 10;
}

function stockForProduct(slug: string) {
  const hash = hashString(`${slug}-stock`);
  return 5 + (hash % 26);
}

function distributeStock(total: number, count: number) {
  const base = Math.floor(total / count);
  const remainder = total % count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

function skuFor(productSlug: string, colorName: string) {
  const colorCode = colorName.toUpperCase().replace(/\s+/g, '');
  return `ZEN-${productSlug.toUpperCase()}-${colorCode}`;
}

function buildVariants(productSlug: string, priceKurus: number, totalStock: number) {
  const colors = pickColors(productSlug);
  const stocks = distributeStock(totalStock, colors.length);

  return colors.map((color, index) => ({
    name: color.name,
    sku: skuFor(productSlug, color.name),
    colorName: color.name,
    colorHex: color.hex,
    material: 'Hakiki deri',
    priceKurus,
    stockQuantity: stocks[index],
    isDefault: index === 0,
    sortOrder: index,
  }));
}

function buildProducts() {
  const manifest = loadManifest();

  return manifest.map((entry) => {
    const adjective = pickAdjective(entry.productSlug);
    const primaryColor = pickColors(entry.productSlug)[0];
    const categoryLabel = entry.categoryName;
    const name = `Hakiki Deri ${categoryLabel} - ${adjective} ${primaryColor.name}`;
    const description = `${adjective} tasarımı ve ${primaryColor.name.toLowerCase()} rengiyle dikkat çeken bu hakiki deri ${categoryLabel.toLowerCase()}, günlük kullanım için özenle üretildi.`;
    const priceRange = priceRangesTry[entry.categorySlug] ?? [300, 600];
    const priceKurus = priceForProduct(entry.productSlug, priceRange);
    const stockQuantity = stockForProduct(entry.productSlug);

    return {
      categorySlug: entry.categorySlug,
      name,
      slug: entry.productSlug,
      description,
      priceKurus,
      currency: 'TRY',
      stockQuantity,
      status: ProductStatus.ACTIVE,
      images: entry.images.map((image, index) => ({
        url: image.filename,
        alt: `${name} ürün görseli ${index + 1}`,
        sortOrder: index,
      })),
      variants: buildVariants(entry.productSlug, priceKurus, stockQuantity),
    };
  });
}

async function main() {
  const products = buildProducts();

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

  const keepSlugs = products.map((product) => product.slug);

  await prisma.product.deleteMany({
    where: {
      slug: {
        notIn: keepSlugs,
      },
    },
  });

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
