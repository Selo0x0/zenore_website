import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ImagesService } from './images.service';

@Controller('images/products')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get(':filename')
  async getImage(
    @Param('filename') filename: string,
    @Query('w') w: string | undefined,
    @Query('format') format: string | undefined,
    @Res() res: Response,
  ) {
    const { path, contentType } = await this.imagesService.getTransformedPath(
      filename,
      { w, format },
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(path);
  }
}
