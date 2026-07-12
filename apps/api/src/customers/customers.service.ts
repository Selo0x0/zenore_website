import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { isValidTurkishPhone } from '../common/phone.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertFromToken(decoded: DecodedIdToken, displayName?: string) {
    const byUid = await this.prisma.customer.findUnique({
      where: { firebaseUid: decoded.uid },
    });
    if (byUid) return byUid;

    const email = decoded.email ?? '';
    const byEmail = email
      ? await this.prisma.customer.findUnique({ where: { email } })
      : null;

    if (byEmail) {
      // Same email re-registered under a new Firebase identity — relink instead of duplicating
      return this.prisma.customer.update({
        where: { id: byEmail.id },
        data: { firebaseUid: decoded.uid },
      });
    }

    const decodedName = typeof decoded.name === 'string' ? decoded.name : null;

    return this.prisma.customer.create({
      data: {
        firebaseUid: decoded.uid,
        email,
        displayName: displayName ?? decodedName,
      },
    });
  }

  async findByFirebaseUid(uid: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { firebaseUid: uid },
    });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı.');
    return customer;
  }

  async updateProfile(
    uid: string,
    data: { displayName?: string; phone?: string },
  ) {
    if (
      data.phone !== undefined &&
      data.phone.trim() &&
      !isValidTurkishPhone(data.phone)
    ) {
      throw new BadRequestException('Geçerli bir telefon numarası giriniz.');
    }

    const customer = await this.findByFirebaseUid(uid);
    return this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        ...(data.displayName !== undefined && {
          displayName: data.displayName,
        }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    });
  }

  async getAddresses(customerId: string) {
    return this.prisma.address.findMany({
      where: { customerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createAddress(
    customerId: string,
    data: {
      label?: string;
      fullName: string;
      phone: string;
      city: string;
      district: string;
      address: string;
      isDefault?: boolean;
    },
  ) {
    if (!isValidTurkishPhone(data.phone)) {
      throw new BadRequestException('Geçerli bir telefon numarası giriniz.');
    }

    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({ data: { customerId, ...data } });
  }

  async updateAddress(
    customerId: string,
    addressId: string,
    data: {
      label?: string;
      fullName?: string;
      phone?: string;
      city?: string;
      district?: string;
      address?: string;
      isDefault?: boolean;
    },
  ) {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, customerId },
    });
    if (!existing) throw new NotFoundException('Adres bulunamadı.');

    if (data.phone !== undefined && !isValidTurkishPhone(data.phone)) {
      throw new BadRequestException('Geçerli bir telefon numarası giriniz.');
    }

    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { customerId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({ where: { id: addressId }, data });
  }

  async deleteAddress(customerId: string, addressId: string) {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, customerId },
    });
    if (!existing) throw new NotFoundException('Adres bulunamadı.');
    await this.prisma.address.delete({ where: { id: addressId } });
    return { success: true };
  }

  async setDefaultAddress(customerId: string, addressId: string) {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, customerId },
    });
    if (!existing) throw new NotFoundException('Adres bulunamadı.');

    return this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }

  async getOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFavorites(customerId: string) {
    return this.prisma.favorite.findMany({
      where: { customerId },
      select: {
        productId: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            priceKurus: true,
            currency: true,
            images: {
              take: 1,
              orderBy: { sortOrder: 'asc' },
              select: { url: true, alt: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFavorite(customerId: string, productId: string) {
    return this.prisma.favorite.upsert({
      where: { customerId_productId: { customerId, productId } },
      create: { customerId, productId },
      update: {},
      select: { productId: true },
    });
  }

  async removeFavorite(customerId: string, productId: string) {
    await this.prisma.favorite.deleteMany({ where: { customerId, productId } });
    return { success: true };
  }
}
