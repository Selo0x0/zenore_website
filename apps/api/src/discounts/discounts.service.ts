import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

type DiscountType = 'PERCENTAGE' | 'FIXED';

export type ValidateResult = {
  valid: true;
  code: string;
  type: DiscountType;
  value: number;
  discountKurus: number;
};

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCode(
    rawCode: string,
    subtotalKurus: number,
  ): Promise<ValidateResult> {
    const code = rawCode.trim().toUpperCase();
    if (!code) throw new BadRequestException('Kod boş olamaz.');

    const discount = await this.prisma.discountCode.findUnique({
      where: { code },
    });
    if (!discount || !discount.isActive) {
      throw new BadRequestException('Geçersiz indirim kodu.');
    }
    if (discount.expiresAt && discount.expiresAt < new Date()) {
      throw new BadRequestException('Bu indirim kodunun süresi dolmuş.');
    }
    if (
      discount.usageLimit !== null &&
      discount.usageCount >= discount.usageLimit
    ) {
      throw new BadRequestException(
        'Bu indirim kodu kullanım limitine ulaşmış.',
      );
    }
    if (
      discount.minOrderKurus !== null &&
      subtotalKurus < discount.minOrderKurus
    ) {
      const minLira = (discount.minOrderKurus / 100).toFixed(0);
      throw new BadRequestException(
        `Bu kod için minimum sepet tutarı ₺${minLira}.`,
      );
    }

    const discountKurus =
      discount.type === 'PERCENTAGE'
        ? Math.round((subtotalKurus * discount.value) / 100)
        : Math.min(discount.value, subtotalKurus);

    return {
      valid: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountKurus,
    };
  }

  async applyUsage(code: string) {
    await this.prisma.discountCode.update({
      where: { code },
      data: { usageCount: { increment: 1 } },
    });
  }

  async list(search?: string) {
    const where = search
      ? {
          code: {
            contains: search.toUpperCase(),
            mode: 'insensitive' as const,
          },
        }
      : {};
    return this.prisma.discountCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: {
    code: string;
    type: DiscountType;
    value: number;
    usageLimit?: number | null;
    minOrderKurus?: number | null;
    expiresAt?: string | null;
    isActive?: boolean;
  }) {
    this.validateDto(dto);
    const code = dto.code.trim().toUpperCase();

    const existing = await this.prisma.discountCode.findUnique({
      where: { code },
    });
    if (existing) throw new BadRequestException('Bu kod zaten kullanılıyor.');

    return this.prisma.discountCode.create({
      data: {
        code,
        type: dto.type,
        value: dto.value,
        usageLimit: dto.usageLimit ?? null,
        minOrderKurus: dto.minOrderKurus ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(
    id: string,
    dto: {
      type?: DiscountType;
      value?: number;
      usageLimit?: number | null;
      minOrderKurus?: number | null;
      expiresAt?: string | null;
      isActive?: boolean;
    },
  ) {
    const existing = await this.prisma.discountCode.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('İndirim kodu bulunamadı.');
    if (dto.type && dto.value !== undefined)
      this.validateDto({
        type: dto.type,
        value: dto.value,
        code: existing.code,
      });

    return this.prisma.discountCode.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.usageLimit !== undefined && { usageLimit: dto.usageLimit }),
        ...(dto.minOrderKurus !== undefined && {
          minOrderKurus: dto.minOrderKurus,
        }),
        ...(dto.expiresAt !== undefined && {
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.discountCode.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('İndirim kodu bulunamadı.');
    await this.prisma.discountCode.delete({ where: { id } });
    return { success: true };
  }

  async generateCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = randomBytes(4).toString('hex').toUpperCase();
      const existing = await this.prisma.discountCode.findUnique({
        where: { code: candidate },
      });
      if (!existing) return candidate;
    }
    throw new BadRequestException('Kod üretilemedi, tekrar deneyin.');
  }

  private validateDto(dto: {
    code: string;
    type: DiscountType;
    value: number;
  }) {
    if (!dto.code?.trim()) throw new BadRequestException('Kod boş olamaz.');
    if (dto.type !== 'PERCENTAGE' && dto.type !== 'FIXED') {
      throw new BadRequestException('Geçersiz indirim tipi.');
    }
    if (!Number.isInteger(dto.value) || dto.value <= 0) {
      throw new BadRequestException('Değer pozitif bir tam sayı olmalıdır.');
    }
    if (dto.type === 'PERCENTAGE' && dto.value > 100) {
      throw new BadRequestException("Yüzde değeri 100'den büyük olamaz.");
    }
  }
}
