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

  get customer() {
    return this.getClient().customer;
  }

  get address() {
    return this.getClient().address;
  }

  get product() {
    return this.getClient().product;
  }

  get order() {
    return this.getClient().order;
  }
  
  $transaction<T>(fn: (tx: ZenorePrismaClient) => Promise<T>): Promise<T> {
    return this.getClient().$transaction(fn);
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
