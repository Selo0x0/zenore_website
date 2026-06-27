import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findActiveProducts() {
    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priceKurus: true,
        currency: true,
        stockQuantity: true,
        createdAt: true,
        updatedAt: true,
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            id: true,
            url: true,
            alt: true,
            sortOrder: true,
          },
        },
      },
    });
  }
}
