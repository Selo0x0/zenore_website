import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CustomersService } from '../customers/customers.service';
import { OrdersService } from './orders.service';

type PlaceOrderBody = {
  shippingName: unknown;
  shippingPhone: unknown;
  shippingCity: unknown;
  shippingDistrict: unknown;
  shippingAddress: unknown;
  items: unknown;
};

@Controller('orders')
@UseGuards(FirebaseAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly customersService: CustomersService,
  ) {}

  @Post()
  async createOrder(
    @CurrentUser() user: DecodedIdToken,
    @Body() body: PlaceOrderBody,
  ) {
    const customer = await this.customersService.findByFirebaseUid(user.uid);
    return this.ordersService.createOrder({
      customerId: customer.id,
      customerName: customer.displayName ?? customer.email,
      customerEmail: customer.email || user.email || '',
      customerPhone: body.shippingPhone,
      shippingName: body.shippingName,
      shippingPhone: body.shippingPhone,
      shippingCity: body.shippingCity,
      shippingDistrict: body.shippingDistrict,
      shippingAddress: body.shippingAddress,
      items: body.items,
    });
  }

  @Get(':orderNumber')
  async getOrder(
    @CurrentUser() user: DecodedIdToken,
    @Param('orderNumber') orderNumber: string,
  ) {
    const customer = await this.customersService.findByFirebaseUid(user.uid);
    return this.ordersService.findByOrderNumber(orderNumber, customer.id);
  }
}
