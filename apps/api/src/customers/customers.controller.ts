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
import { Throttle } from '@nestjs/throttler';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CustomersService } from './customers.service';
import { UpsertMeDto } from './dto/upsert-me.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddFavoriteDto } from './dto/add-favorite.dto';

@Controller('customers')
@UseGuards(FirebaseAuthGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('me')
  @HttpCode(200)
  upsertMe(@CurrentUser() user: DecodedIdToken, @Body() dto: UpsertMeDto) {
    return this.customers.upsertFromToken(user, dto.displayName);
  }

  @Get('me')
  getMe(@CurrentUser() user: DecodedIdToken) {
    return this.customers.findByFirebaseUid(user.uid);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: DecodedIdToken, @Body() dto: UpdateMeDto) {
    return this.customers.updateProfile(user.uid, dto);
  }

  @Get('me/addresses')
  async getAddresses(@CurrentUser() user: DecodedIdToken) {
    const customer = await this.customers.findByFirebaseUid(user.uid);
    return this.customers.getAddresses(customer.id);
  }

  @Post('me/addresses')
  async createAddress(
    @CurrentUser() user: DecodedIdToken,
    @Body() dto: CreateAddressDto,
  ) {
    const customer = await this.customers.findByFirebaseUid(user.uid);
    return this.customers.createAddress(customer.id, dto);
  }

  @Patch('me/addresses/:id')
  async updateAddress(
    @CurrentUser() user: DecodedIdToken,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const customer = await this.customers.findByFirebaseUid(user.uid);
    return this.customers.updateAddress(customer.id, addressId, dto);
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
    @Body() dto: AddFavoriteDto,
  ) {
    const customer = await this.customers.findByFirebaseUid(user.uid);
    return this.customers.addFavorite(customer.id, dto.productId);
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
