import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalFirebaseAuthGuard } from '../auth/optional-firebase-auth.guard';
import { CustomersService } from '../customers/customers.service';
import { OrdersService } from './orders.service';

type PlaceOrderBody = {
  customerName?: unknown;
  customerEmail?: unknown;
  customerPhone?: unknown;
  shippingName: unknown;
  shippingPhone: unknown;
  shippingCity: unknown;
  shippingDistrict: unknown;
  shippingAddress: unknown;
  items: unknown;
  discountCode?: unknown;
};

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly customersService: CustomersService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(OptionalFirebaseAuthGuard)
  @Post()
  async createOrder(
    @CurrentUser() user: DecodedIdToken | undefined,
    @Body() body: PlaceOrderBody,
  ) {
    const customer = user
      ? await this.customersService.findByFirebaseUid(user.uid)
      : null;

    return this.ordersService.createOrder({
      ...(customer && { customerId: customer.id }),
      customerName: customer
        ? (customer.displayName ?? customer.email)
        : body.customerName,
      customerEmail: customer
        ? customer.email || user?.email || ''
        : body.customerEmail,
      customerPhone: customer ? body.shippingPhone : body.customerPhone,
      shippingName: body.shippingName,
      shippingPhone: body.shippingPhone,
      shippingCity: body.shippingCity,
      shippingDistrict: body.shippingDistrict,
      shippingAddress: body.shippingAddress,
      items: body.items,
      discountCode: body.discountCode,
    });
  }

  @Get(':orderNumber')
  findOrder(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findPublicByOrderNumber(orderNumber);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me/:orderNumber')
  async getOrder(
    @CurrentUser() user: DecodedIdToken,
    @Param('orderNumber') orderNumber: string,
  ) {
    const customer = await this.customersService.findByFirebaseUid(user.uid);
    return this.ordersService.findByOrderNumber(orderNumber, customer.id);
  }
}
