import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { IsAdminGuard } from '../auth/is-admin.guard';
import { ShippingService } from './shipping.service';

class UpdateShippingSettingsDto {
  @IsInt()
  @Min(0)
  feeKurus!: number;

  @IsInt()
  @Min(0)
  freeShippingThresholdKurus!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Controller()
export class ShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Get('shipping-settings')
  getPublicSettings() {
    return this.shipping.getSettings();
  }

  @UseGuards(FirebaseAuthGuard, IsAdminGuard)
  @Get('admin/shipping-settings')
  getAdminSettings() {
    return this.shipping.getSettings();
  }

  @UseGuards(FirebaseAuthGuard, IsAdminGuard)
  @Put('admin/shipping-settings')
  async updateAdminSettings(@Body() dto: UpdateShippingSettingsDto) {
    const row = await this.shipping.updateSettings({
      feeKurus: dto.feeKurus,
      freeShippingThresholdKurus: dto.freeShippingThresholdKurus,
      isActive: dto.isActive ?? true,
    });
    return row.value;
  }
}
