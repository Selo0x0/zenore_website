import 'dotenv/config';
import { createPrismaClient } from './index.ts';

const prisma = createPrismaClient();

// Marker domain so these accounts and their reviews are trivially identifiable
// and removable before real production launch — see clear-mock-reviews.ts.
const SEED_EMAIL_DOMAIN = 'zenore.internal';

const reviewers = [
  'Elif K.',
  'Mert Y.',
  'Selin A.',
  'Caner T.',
  'Buse D.',
  'Emre S.',
  'Gizem P.',
  'Onur K.',
  'İrem B.',
  'Kaan Ö.',
];

type Template = { title: string | null; body: string };

const fiveStar: Template[] = [
  { title: 'Kesinlikle tavsiye ederim', body: 'Kalitesi gerçekten çok iyi, deri kokusu bile insanı mutlu ediyor.' },
  { title: 'Çok memnun kaldım', body: 'Tam beklediğim gibi geldi, dikişler çok özenli.' },
  { title: null, body: 'Uzun zamandır aradığım ürün, pişman olmadım.' },
  { title: 'Harika bir ürün', body: 'Hediye olarak aldım, çok beğenildi.' },
  { title: null, body: 'Fiyatına göre kalitesi harika, tavsiye ederim.' },
  { title: 'Beklentimin üzerinde', body: 'Görsellerdekinden bile daha güzel duruyor, çok şık.' },
  { title: null, body: 'Hakiki deri olduğu ilk dokunuşta belli oluyor, çok memnunum.' },
];

const fourStar: Template[] = [
  { title: 'Genel olarak iyi', body: 'Memnunum, sadece kargo biraz gecikti.' },
  { title: null, body: 'Ürün güzel ama beklediğimden biraz küçük geldi.' },
  { title: 'Fena değil', body: 'Kaliteli duruyor, zamanla nasıl yıpranacağını göreceğiz.' },
  { title: null, body: 'İyi bir ürün, rengi görseldekinden biraz farklıydı.' },
];

const threeStar: Template[] = [
  { title: null, body: 'Fena değil ama fiyatına göre daha iyisini beklerdim.' },
  { title: 'Ortalama', body: 'Kalitesi idare eder, çok özel bir şey değil.' },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickRatingAndTemplate(seed: string) {
  const hash = hashString(seed);
  const bucket = hash % 100;

  if (bucket < 60) return { rating: 5, ...fiveStar[hash % fiveStar.length] };
  if (bucket < 90) return { rating: 4, ...fourStar[hash % fourStar.length] };
  return { rating: 3, ...threeStar[hash % threeStar.length] };
}

function reviewerIndicesForProduct(slug: string, count: number, total: number): number[] {
  return Array.from({ length: total }, (_, i) => i)
    .sort((a, b) => hashString(`${slug}-order-${a}`) - hashString(`${slug}-order-${b}`))
    .slice(0, count);
}

async function main() {
  const customerIdByKey = new Map<string, string>();

  for (let i = 0; i < reviewers.length; i++) {
    const key = `yorum-seed-${i + 1}`;
    const email = `${key}@${SEED_EMAIL_DOMAIN}`;
    const record = await prisma.customer.upsert({
      where: { email },
      update: { displayName: reviewers[i] },
      create: { email, displayName: reviewers[i], firebaseUid: `seed-${key}` },
    });
    customerIdByKey.set(key, record.id);
  }

  const products = await prisma.product.findMany({ select: { id: true, slug: true } });

  let created = 0;

  for (const product of products) {
    const hasReviews = hashString(`${product.slug}-has-reviews`) % 100 < 55;
    if (!hasReviews) continue;

    const countRoll = hashString(`${product.slug}-review-count`) % 100;
    const count = countRoll < 60 ? 1 : countRoll < 90 ? 2 : 3;

    const reviewerIndices = reviewerIndicesForProduct(product.slug, count, reviewers.length);

    for (const reviewerIndex of reviewerIndices) {
      const customerKey = `yorum-seed-${reviewerIndex + 1}`;
      const customerId = customerIdByKey.get(customerKey);
      if (!customerId) continue;

      const contentSeed = `${product.slug}-${customerKey}-content`;
      const { rating, title, body } = pickRatingAndTemplate(contentSeed);
      const isVerified = hashString(`${contentSeed}-verified`) % 100 < 35;

      await prisma.review.upsert({
        where: {
          productId_customerId: { productId: product.id, customerId },
        },
        update: { rating, title, body, isVerified, status: 'APPROVED' },
        create: {
          productId: product.id,
          customerId,
          rating,
          title,
          body,
          isVerified,
          status: 'APPROVED',
        },
      });
      created++;
    }
  }

  console.info(`Seeded ${customerIdByKey.size} mock reviewer accounts.`);
  console.info(`Seeded ${created} mock reviews across ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
