import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listApprovedForProduct(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Ürün bulunamadı.');

    const reviews = await this.prisma.review.findMany({
      where: { productId: product.id, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        isVerified: true,
        createdAt: true,
        customer: { select: { displayName: true } },
      },
    });

    const count = reviews.length;
    const average =
      count > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / count
        : 0;

    return { reviews, average, count };
  }

  async create(customerId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Ürün bulunamadı.');

    const purchase = await this.prisma.orderItem.findFirst({
      where: {
        productId: dto.productId,
        order: { customerId, status: { not: 'CANCELLED' } },
      },
    });

    try {
      return await this.prisma.review.create({
        data: {
          productId: dto.productId,
          customerId,
          rating: dto.rating,
          title: dto.title,
          body: dto.body,
          isVerified: !!purchase,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Bu ürün için zaten bir yorum yaptınız.');
      }
      throw error;
    }
  }

  async listForAdmin(status?: string) {
    return this.prisma.review.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, slug: true } },
        customer: { select: { displayName: true, email: true } },
      },
    });
  }

  async updateStatus(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Yorum bulunamadı.');
    return this.prisma.review.update({ where: { id }, data: { status } });
  }

  async remove(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Yorum bulunamadı.');
    await this.prisma.review.delete({ where: { id } });
    return { success: true };
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  );
}
