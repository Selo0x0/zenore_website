import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CustomersService } from './customers.service';

@Controller('customers')
@UseGuards(FirebaseAuthGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post('me')
  @HttpCode(200)
  upsertMe(
    @CurrentUser() user: DecodedIdToken,
    @Body('displayName') displayName?: string,
  ) {
    return this.customers.upsertFromToken(user, displayName);
  }

  @Get('me')
  getMe(@CurrentUser() user: DecodedIdToken) {
    return this.customers.findByFirebaseUid(user.uid);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: DecodedIdToken,
    @Body() body: { displayName?: string; phone?: string },
  ) {
    return this.customers.updateProfile(user.uid, body);
  }

  @Get('me/addresses')
  async getAddresses(@CurrentUser() user: DecodedIdToken) {
    const customer = await this.customers.findByFirebaseUid(user.uid);
    return this.customers.getAddresses(customer.id);
  }

  @Post('me/addresses')
  async createAddress(
    @CurrentUser() user: DecodedIdToken,
    @Body()
    body: {
      label?: string;
      fullName: string;
      phone: string;
      city: string;
      district: string;
      address: string;
      isDefault?: boolean;
    },
  ) {
    const customer = await this.customers.findByFirebaseUid(user.uid);
    return this.customers.createAddress(customer.id, body);
  }

  @Patch('me/addresses/:id')
  async updateAddress(
    @CurrentUser() user: DecodedIdToken,
    @Param('id') addressId: string,
    @Body()
    body: {
      label?: string;
      fullName?: string;
      phone?: string;
      city?: string;
      district?: string;
      address?: string;
      isDefault?: boolean;
    },
  ) {
    const customer = await this.customers.findByFirebaseUid(user.uid);
    return this.customers.updateAddress(customer.id, addressId, body);
  }

  @Delete('me/addresses/:id')
  @HttpCode(200)
  async deleteAddress(
    @CurrentUser() user: DecodedIdToken,
    @Param('id') addressId: string,
  ) {
    const customer = await this.customers.findByFirebaseUid(user.uid);
    return this.customers.deleteAddress(customer.id, addressId);
  }

  @Patch('me/addresses/:id/default')
  async setDefaultAddress(
    @CurrentUser() user: DecodedIdToken,
    @Param('id') addressId: string,
  ) {
    const customer = await this.customers.findByFirebaseUid(user.uid);
    return this.customers.setDefaultAddress(customer.id, addressId);
  }

  @Get('me/orders')
  async getOrders(@CurrentUser() user: DecodedIdToken) {
    const customer = await this.customers.findByFirebaseUid(user.uid);
    return this.customers.getOrders(customer.id);
  }

  @Get('me/favorites')
  async getFavorites(@CurrentUser() user: DecodedIdToken) {
    const customer = await this.customers.findByFirebaseUid(user.uid);
    return this.customers.getFavorites(customer.id);
  }

  @Post('me/favorites')
  async addFavorite(
    @CurrentUser() user: DecodedIdToken,
    @Body('productId') productId: string,
  ) {
    const customer = await this.customers.findByFirebaseUid(user.uid);
    return this.customers.addFavorite(customer.id, productId);
  }

  @Delete('me/favorites/:productId')
  @HttpCode(200)
  async removeFavorite(
    @CurrentUser() user: DecodedIdToken,
    @Param('productId') productId: string,
  ) {
    const customer = await this.customers.findByFirebaseUid(user.uid);
    return this.customers.removeFavorite(customer.id, productId);
  }
}
