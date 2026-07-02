import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const productSelect = {
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
} as const;

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
      select: productSelect,
    });
  }

  findByCategorySlug(categorySlug: string) {
    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        category: { slug: categorySlug },
      },
      orderBy: { createdAt: 'desc' },
      select: productSelect,
    });
  }

  async findActiveProductBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        status: 'ACTIVE',
      },
      select: productSelect,
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return product;
  }
}
