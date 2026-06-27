import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = process.env.API_PORT ?? process.env.PORT ?? 4000;
  const uploadsPath = resolve(
    process.cwd(),
    process.env.UPLOADS_DIR ?? '../../uploads',
  );

  mkdirSync(uploadsPath, { recursive: true });

  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    index: false,
  });

  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
