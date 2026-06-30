import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);

type CategorySource = {
  categorySlug: string;
  categoryName: string;
  sourcePaths: string[];
  flatFiles?: boolean;
};

const categorySources: CategorySource[] = [
  {
    categorySlug: 'airpods-kilif',
    categoryName: 'AirPods Kılıf',
    sourcePaths: ['apple/AirPods Deri Kılıf'],
  },
  {
    categorySlug: 'macbook-kilif',
    categoryName: 'MacBook Kılıf',
    sourcePaths: ['apple/MacBook Kılıf'],
  },
  {
    categorySlug: 'apple-watch-kordonu',
    categoryName: 'Apple Watch Kordonu',
    sourcePaths: ['apple/apple watch'],
  },
  {
    categorySlug: 'iphone-kilif',
    categoryName: 'iPhone Kılıf',
    sourcePaths: ['apple/ıphone kılıf'],
  },
  {
    categorySlug: 'cuzdan',
    categoryName: 'Cüzdan',
    sourcePaths: ['cüzdan'],
  },
  {
    categorySlug: 'canta',
    categoryName: 'Çanta',
    sourcePaths: ['çanta'],
  },
  {
    categorySlug: 'deri-saat-kutusu',
    categoryName: 'Deri Saat Kutusu',
    sourcePaths: ['deri-saat-kutusu'],
  },
  {
    categorySlug: 'gozluk-kilifi',
    categoryName: 'Gözlük Kılıfı',
    sourcePaths: ['gözlük kılıfı'],
  },
  {
    categorySlug: 'deri-kalemlik',
    categoryName: 'Deri Kalemlik',
    sourcePaths: [
      'ofis kırtasiye/kalemlik/canta kalemlik',
      'ofis kırtasiye/kalemlik/düz kalemlik',
      'ofis kırtasiye/kalemlik/kapaklı deri kalemlik',
    ],
  },
  {
    categorySlug: 'masa-mati',
    categoryName: 'Masa Matı',
    sourcePaths: ['ofis kırtasiye/masa matı'],
  },
  {
    categorySlug: 'mouse-pad',
    categoryName: 'Mouse Pad',
    sourcePaths: ['ofis kırtasiye/mouse pad'],
  },
  {
    categorySlug: 'saat-kordonu',
    categoryName: 'Saat Kordonu',
    sourcePaths: ['saat kordonları'],
  },
  {
    categorySlug: 'pec',
    categoryName: 'Peç',
    sourcePaths: ['peç'],
    flatFiles: true,
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

function naturalCompare(a: string, b: string): number {
  const normalize = (value: string) => value.replace(/\s+/g, '');
  const ax = normalize(a).match(/\d+|\D+/g) ?? [a];
  const bx = normalize(b).match(/\d+|\D+/g) ?? [b];
  const length = Math.max(ax.length, bx.length);

  for (let i = 0; i < length; i++) {
    const av = ax[i] ?? '';
    const bv = bx[i] ?? '';
    const an = Number(av);
    const bn = Number(bv);

    if (av !== '' && bv !== '' && !Number.isNaN(an) && !Number.isNaN(bn)) {
      if (an !== bn) {
        return an - bn;
      }
    } else if (av !== bv) {
      return av < bv ? -1 : 1;
    }
  }

  return 0;
}

async function listImageFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });

  return entries
    .filter(
      (entry) =>
        entry.isFile() && allowedExtensions.has(extname(entry.name).toLowerCase()),
    )
    .map((entry) => entry.name)
    .sort(naturalCompare);
}

async function findLeafDirs(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const subdirs = entries
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => naturalCompare(a.name, b.name));

  if (subdirs.length === 0) {
    return [dir];
  }

  const results: string[] = [];

  for (const subdir of subdirs) {
    results.push(...(await findLeafDirs(join(dir, subdir.name))));
  }

  return results;
}

async function main() {
  const siteSourceRoot = process.env.SITE_PHOTOS_DIR ?? '/Users/m3x/dev/site_photos';
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(scriptDir, '../../../../..');
  const originalsDir = resolve(repoRoot, 'uploads/products/originals');
  const manifestPath = resolve(
    repoRoot,
    'packages/db/src/data/product-photos.manifest.json',
  );

  await mkdir(originalsDir, { recursive: true });

  const manifest: ManifestProduct[] = [];
  let skippedInvalid = 0;

  for (const source of categorySources) {
    const leafFolders: { folder: string; files: string[] }[] = [];

    for (const sourcePath of source.sourcePaths) {
      const dir = resolve(siteSourceRoot, sourcePath);

      if (source.flatFiles) {
        const files = await listImageFiles(dir);
        for (const file of files) {
          leafFolders.push({ folder: dir, files: [file] });
        }
        continue;
      }

      const leaves = await findLeafDirs(dir);
      for (const leaf of leaves) {
        const files = await listImageFiles(leaf);
        if (files.length > 0) {
          leafFolders.push({ folder: leaf, files });
        }
      }
    }

    let sequence = 0;

    for (const { folder, files } of leafFolders) {
      sequence += 1;
      const productSlug = `${source.categorySlug}-${sequence}`;
      const images: ManifestImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const sourceFile = resolve(folder, files[i]);
        const buffer = await readFile(sourceFile);

        try {
          await sharp(buffer).metadata();
        } catch {
          console.warn(`Skipping invalid image: ${sourceFile}`);
          skippedInvalid += 1;
          continue;
        }

        const extension = extname(files[i]).toLowerCase();
        const destFilename = `${productSlug}-${i + 1}${extension}`;
        await writeFile(resolve(originalsDir, destFilename), buffer);

        images.push({
          filename: destFilename,
          sourceFile: relative(siteSourceRoot, sourceFile),
        });
      }

      if (images.length === 0) {
        continue;
      }

      manifest.push({
        categorySlug: source.categorySlug,
        categoryName: source.categoryName,
        productSlug,
        suggestedName: `${source.categoryName} ${sequence}`,
        sourceFolder: relative(siteSourceRoot, folder),
        images,
      });
    }
  }

  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const totalImages = manifest.reduce((sum, product) => sum + product.images.length, 0);

  console.info(`Imported ${manifest.length} products, ${totalImages} images.`);

  if (skippedInvalid > 0) {
    console.warn(`Skipped ${skippedInvalid} invalid file(s).`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
