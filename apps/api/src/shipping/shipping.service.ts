import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SHIPPING_SETTINGS_KEY = 'shipping_settings';

export type ShippingSettings = {
  feeKurus: number;
  freeShippingThresholdKurus: number;
  isActive: boolean;
};

const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  feeKurus: 15000,
  freeShippingThresholdKurus: 200000,
  isActive: true,
};

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<ShippingSettings> {
    const row = await this.prisma.siteContent.findUnique({
      where: { key: SHIPPING_SETTINGS_KEY },
    });

    return this.normalizeSettings(row?.value);
  }

  async updateSettings(dto: Partial<ShippingSettings>) {
    const settings = this.normalizeSettings({
      ...DEFAULT_SHIPPING_SETTINGS,
      ...dto,
    });

    return this.prisma.siteContent.upsert({
      where: { key: SHIPPING_SETTINGS_KEY },
      update: { value: settings },
      create: {
        key: SHIPPING_SETTINGS_KEY,
        value: settings,
      },
    });
  }

  async calculateShippingKurus(subtotalKurus: number) {
    if (!Number.isInteger(subtotalKurus) || subtotalKurus < 0) {
      throw new BadRequestException('subtotalKurus geçersiz.');
    }

    const settings = await this.getSettings();
    if (!settings.isActive) return 0;
    if (subtotalKurus >= settings.freeShippingThresholdKurus) return 0;
    return settings.feeKurus;
  }

  private normalizeSettings(value: unknown): ShippingSettings {
    if (!this.isRecord(value)) return DEFAULT_SHIPPING_SETTINGS;

    const settings = {
      feeKurus: this.asNonNegativeInt(
        value.feeKurus,
        DEFAULT_SHIPPING_SETTINGS.feeKurus,
      ),
      freeShippingThresholdKurus: this.asNonNegativeInt(
        value.freeShippingThresholdKurus,
        DEFAULT_SHIPPING_SETTINGS.freeShippingThresholdKurus,
      ),
      isActive:
        typeof value.isActive === 'boolean'
          ? value.isActive
          : DEFAULT_SHIPPING_SETTINGS.isActive,
    };

    if (settings.isActive && settings.feeKurus === 0) {
      throw new BadRequestException('Kargo ücreti 0 olamaz.');
    }

    return settings;
  }

  private asNonNegativeInt(value: unknown, fallback: number): number {
    if (value === undefined || value === null) return fallback;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
      throw new BadRequestException('Kargo ayarları geçersiz.');
    }
    return value;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
