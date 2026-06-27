import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ZenorePrismaClient } from '@zenore/db';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: ZenorePrismaClient | null = null;
  private readonly connectionString: string | undefined;

  constructor(configService: ConfigService) {
    this.connectionString = configService.get<string>('DATABASE_URL');
  }

  get product() {
    return this.getClient().product;
  }

  async onModuleInit() {
    const client = await this.createClient();
    await client.$connect();
  }

  async onModuleDestroy() {
    await this.client?.$disconnect();
  }

  private getClient() {
    if (!this.client) {
      throw new Error('Prisma client has not been initialized.');
    }

    return this.client;
  }

  private async createClient() {
    if (!this.client) {
      const { createPrismaClient } = await import('@zenore/db');
      this.client = createPrismaClient(this.connectionString);
    }

    return this.client;
  }
}
