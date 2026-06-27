import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const product = {
    id: 'product-id',
    name: 'Classic Leather Wallet',
    slug: 'classic-leather-wallet',
    description: 'A compact leather wallet designed for daily use.',
    priceKurus: 149990,
    currency: 'TRY',
    stockQuantity: 12,
    createdAt: new Date('2026-06-27T18:35:59.621Z'),
    updatedAt: new Date('2026-06-27T18:35:59.621Z'),
    images: [],
  };

  const prisma = {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  let service: ProductsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductsService(prisma as unknown as PrismaService);
  });

  it('returns active products', async () => {
    prisma.product.findMany.mockResolvedValue([product]);

    await expect(service.findActiveProducts()).resolves.toEqual([product]);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'ACTIVE',
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    );
  });

  it('returns an active product by slug', async () => {
    prisma.product.findFirst.mockResolvedValue(product);

    await expect(
      service.findActiveProductBySlug('classic-leather-wallet'),
    ).resolves.toEqual(product);

    expect(prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: 'classic-leather-wallet',
          status: 'ACTIVE',
        },
      }),
    );
  });

  it('throws 404 when the active product is not found', async () => {
    prisma.product.findFirst.mockResolvedValue(null);

    await expect(
      service.findActiveProductBySlug('missing-product'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
