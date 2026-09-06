import {
  BadRequestException,
  Body,
  Controller,
  Header,
  Headers,
  HttpCode,
  Ip,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalFirebaseAuthGuard } from '../auth/optional-firebase-auth.guard';
import { PaymentsService, type PaytrCallbackBody } from './payments.service';

type InitPaymentBody = {
  orderNumber?: unknown;
};

@Controller('payments/paytr')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(OptionalFirebaseAuthGuard)
  @Post('init')
  @Header('Cache-Control', 'no-store')
  async init(
    @Ip() ip: string,
    @CurrentUser() user: DecodedIdToken | undefined,
    @Headers('x-order-access-token') guestAccessToken: string | undefined,
    @Body() body: InitPaymentBody,
  ) {
    if (typeof body.orderNumber !== 'string' || !body.orderNumber) {
      throw new BadRequestException('orderNumber is required.');
    }

    return this.payments.initPayment(
      body.orderNumber,
      ip,
      user?.uid,
      guestAccessToken,
    );
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
