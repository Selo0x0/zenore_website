import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import sharp from 'sharp';

const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);

@Injectable()
export class StorageService {
  private readonly uploadsRoot = resolve(
    process.cwd(),
    process.env.UPLOADS_DIR ?? '../../uploads',
  );

  getOriginalsDir() {
    return resolve(this.uploadsRoot, 'products/originals');
  }

  async saveOriginal(buffer: Buffer, filename: string): Promise<string> {
    const extension = extname(filename).toLowerCase();

    if (!allowedExtensions.has(extension)) {
      throw new BadRequestException(`Unsupported image type: ${extension}`);
    }

    try {
      await sharp(buffer).metadata();
    } catch {
      throw new BadRequestException('File is not a valid image.');
    }

    const dir = this.getOriginalsDir();
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, filename), buffer);

    return filename;
  }
}
