import {
  BadRequestException,
  Body,
  Controller,
  Header,
  HttpCode,
  Ip,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CustomersService } from '../customers/customers.service';
import { PaymentsService, type PaytrCallbackBody } from './payments.service';

type InitPaymentBody = {
  orderNumber?: unknown;
};

@Controller('payments/paytr')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly customersService: CustomersService,
  ) {}

  @UseGuards(FirebaseAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('init')
  async init(
    @CurrentUser() user: DecodedIdToken,
    @Ip() ip: string,
    @Body() body: InitPaymentBody,
  ) {
    if (typeof body.orderNumber !== 'string' || !body.orderNumber) {
      throw new BadRequestException('orderNumber is required.');
    }

    const customer = await this.customersService.findByFirebaseUid(user.uid);
    return this.payments.initPayment(body.orderNumber, customer.id, ip);
  }

  @SkipThrottle()
  @Post('callback')
  @HttpCode(200)
  @Header('Content-Type', 'text/plain')
  async callback(@Body() body: PaytrCallbackBody) {
    const accepted = await this.payments.handleCallback(body);
    if (!accepted) {
      // Do NOT return "OK" for a rejected notification (invalid hash,
      // malformed body) — PayTR should retry rather than treat this as
      // acknowledged.
      throw new BadRequestException();
    }
    return 'OK';
  }
}
