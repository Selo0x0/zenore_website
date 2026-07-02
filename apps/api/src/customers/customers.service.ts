import { Injectable } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertFromToken(decoded: DecodedIdToken, displayName?: string) {
    const existing = await this.prisma.customer.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.customer.create({
      data: {
        firebaseUid: decoded.uid,
        email: decoded.email ?? '',
        displayName: displayName ?? decoded.name ?? null,
      },
    });
  }
}
