import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello() {
    return {
      name: 'Zenore API',
      status: 'ok',
    };
  }

  async getDatabaseHealth() {
    const productCount = await this.prisma.product.count();

    return {
      status: 'ok',
      productCount,
    };
  }
}
