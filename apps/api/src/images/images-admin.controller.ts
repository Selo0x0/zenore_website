import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomBytes } from 'node:crypto';
import { extname } from 'node:path';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { IsAdminGuard } from '../auth/is-admin.guard';
import { StorageService } from '../storage/storage.service';

const maxSizeBytes = 8 * 1024 * 1024;

@Controller('admin/images')
@UseGuards(FirebaseAuthGuard, IsAdminGuard)
export class ImagesAdminController {
  constructor(private readonly storage: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya bulunamadı.');
    if (file.size > maxSizeBytes) {
      throw new BadRequestException("Dosya boyutu 8MB'ı geçemez.");
    }

    const extension = extname(file.originalname).toLowerCase();
    const filename = `${randomBytes(8).toString('hex')}${extension}`;

    await this.storage.saveOriginal(file.buffer, filename);

    return { filename };
  }
}
