import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

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
}
