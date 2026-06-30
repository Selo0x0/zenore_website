import { Injectable, NotFoundException } from '@nestjs/common';
import { access, mkdir } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import sharp from 'sharp';
import { StorageService } from '../storage/storage.service';

const allowedFormats = new Set(['webp', 'jpeg', 'png']);
const minWidth = 16;
const maxWidth = 2400;
const defaultWidth = 1200;
const defaultFormat = 'webp';

@Injectable()
export class ImagesService {
  constructor(private readonly storage: StorageService) {}

  private get cacheDir() {
    return resolve(this.storage.getOriginalsDir(), '..', 'cache');
  }

  async getTransformedPath(
    rawFilename: string,
    query: { w?: string; format?: string },
  ): Promise<{ path: string; contentType: string }> {
    const filename = basename(rawFilename);
    const originalPath = resolve(this.storage.getOriginalsDir(), filename);

    if (!(await this.fileExists(originalPath))) {
      throw new NotFoundException('Image not found.');
    }

    const width = this.clampWidth(query.w);
    const format = this.resolveFormat(query.format);
    const extension = extname(filename);
    const cacheKey = `${basename(filename, extension)}__w${width}.${format}`;
    const cachePath = resolve(this.cacheDir, cacheKey);

    if (await this.fileExists(cachePath)) {
      return { path: cachePath, contentType: `image/${format}` };
    }

    await mkdir(this.cacheDir, { recursive: true });

    const transformer = sharp(originalPath).resize({
      width,
      withoutEnlargement: true,
    });

    if (format === 'webp') {
      transformer.webp({ quality: 82 });
    } else if (format === 'jpeg') {
      transformer.jpeg({ quality: 85 });
    } else {
      transformer.png({ quality: 85 });
    }

    await transformer.toFile(cachePath);

    return { path: cachePath, contentType: `image/${format}` };
  }

  private clampWidth(value?: string) {
    const parsed = Number.parseInt(value ?? '', 10);

    if (!Number.isFinite(parsed)) {
      return defaultWidth;
    }

    return Math.min(Math.max(parsed, minWidth), maxWidth);
  }

  private resolveFormat(value?: string) {
    return value && allowedFormats.has(value) ? value : defaultFormat;
  }

  private async fileExists(path: string) {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }
}
