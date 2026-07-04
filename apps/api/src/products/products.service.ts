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
  category: {
    select: {
      slug: true,
      name: true,
    },
  },
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

  async findRelatedProducts(slug: string, limit = 12) {
    const current = await this.prisma.product.findFirst({
      where: { slug, status: 'ACTIVE' },
      select: { categoryId: true },
    });

    if (!current?.categoryId) return [];

    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        categoryId: current.categoryId,
        slug: { not: slug },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: productSelect,
    });
  }

  async findFeaturedProducts(slug: string, limit = 8) {
    const current = await this.prisma.product.findFirst({
      where: { slug, status: 'ACTIVE' },
      select: { categoryId: true },
    });

    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        slug: { not: slug },
        ...(current?.categoryId ? { categoryId: { not: current.categoryId } } : {}),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: productSelect,
    });
  }
}
