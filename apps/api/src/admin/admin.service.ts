import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
type ProductStatus = (typeof PRODUCT_STATUSES)[number];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayOrders, pendingOrders, lowStockCount, revenueAgg] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.product.count({ where: { status: 'ACTIVE', stockQuantity: { lte: 5 } } }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { totalKurus: true },
      }),
    ]);

    return {
      todayOrders,
      pendingOrders,
      lowStockCount,
      todayRevenueKurus: revenueAgg._sum.totalKurus ?? 0,
    };
  }

  async getRecentOrders(limit = 8) {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        customerName: true,
        totalKurus: true,
        currency: true,
        createdAt: true,
      },
    });
  }

  async getOrders(status?: string, page = 1, limit = 25) {
    const where = status && ORDER_STATUSES.includes(status as OrderStatus)
      ? { status: status as OrderStatus }
      : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          customerName: true,
          customerEmail: true,
          shippingCity: true,
          totalKurus: true,
          currency: true,
          createdAt: true,
          items: { select: { quantity: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit };
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Sipariş bulunamadı.');
    return order;
  }

  async updateOrderStatus(id: string, status: string) {
    if (!ORDER_STATUSES.includes(status as OrderStatus)) {
      throw new BadRequestException('Geçersiz sipariş durumu.');
    }
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı.');

    return this.prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
      select: { id: true, orderNumber: true, status: true },
    });
  }

  // ── Products ──────────────────────────────────────────────────────────────

  async getProducts(status?: string, page = 1, limit = 25) {
    const where = status && PRODUCT_STATUSES.includes(status as ProductStatus)
      ? { status: status as ProductStatus }
      : {};

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          priceKurus: true,
          currency: true,
          stockQuantity: true,
          category: { select: { id: true, name: true } },
          images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true, alt: true } },
          createdAt: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total, page, limit };
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException('Ürün bulunamadı.');
    return product;
  }

  async createProduct(dto: {
    name: string;
    slug: string;
    description?: string;
    priceKurus: number;
    stockQuantity?: number;
    status?: string;
    categoryId?: string;
    imageUrls?: string[];
  }) {
    const { imageUrls = [], status = 'DRAFT', ...rest } = dto;
    if (!PRODUCT_STATUSES.includes(status as ProductStatus)) {
      throw new BadRequestException('Geçersiz ürün durumu.');
    }
    return this.prisma.product.create({
      data: {
        ...rest,
        status: status as ProductStatus,
        images: {
          create: imageUrls.map((url, sortOrder) => ({ url, sortOrder })),
        },
      },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async updateProduct(id: string, dto: {
    name?: string;
    slug?: string;
    description?: string;
    priceKurus?: number;
    stockQuantity?: number;
    status?: string;
    categoryId?: string;
    imageUrls?: string[];
  }) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Ürün bulunamadı.');

    const { imageUrls, status, ...rest } = dto;

    if (status && !PRODUCT_STATUSES.includes(status as ProductStatus)) {
      throw new BadRequestException('Geçersiz ürün durumu.');
    }

    if (imageUrls !== undefined) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(status ? { status: status as ProductStatus } : {}),
        ...(imageUrls !== undefined
          ? { images: { create: imageUrls.map((url, sortOrder) => ({ url, sortOrder })) } }
          : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async archiveProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Ürün bulunamadı.');
    return this.prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      select: { id: true, name: true, status: true },
    });
  }

  // ── Categories ────────────────────────────────────────────────────────────

  async getCategories() {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } }, parent: { select: { id: true, name: true } } },
    });
  }

  async createCategory(dto: {
    name: string;
    slug: string;
    description?: string;
    isVisible?: boolean;
    sortOrder?: number;
    parentId?: string | null;
  }) {
    return this.prisma.category.create({
      data: dto,
      include: { _count: { select: { products: true } }, parent: { select: { id: true, name: true } } },
    });
  }

  async updateCategory(id: string, dto: {
    name?: string;
    slug?: string;
    description?: string;
    isVisible?: boolean;
    sortOrder?: number;
    parentId?: string | null;
  }) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Kategori bulunamadı.');
    return this.prisma.category.update({
      where: { id },
      data: dto,
      include: { _count: { select: { products: true } }, parent: { select: { id: true, name: true } } },
    });
  }
}
