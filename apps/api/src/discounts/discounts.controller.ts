import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsInt, IsString, Min, MinLength } from 'class-validator';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalFirebaseAuthGuard } from '../auth/optional-firebase-auth.guard';
import { CustomersService } from '../customers/customers.service';
import { DiscountsService } from './discounts.service';

class ValidateDiscountDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsInt()
  @Min(0)
  subtotalKurus!: number;
}

@Controller('discount-codes')
export class DiscountsController {
  constructor(
    private readonly discounts: DiscountsService,
    private readonly customers: CustomersService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(OptionalFirebaseAuthGuard)
  @Post('validate')
  async validate(
    @CurrentUser() user: DecodedIdToken | undefined,
    @Body() body: ValidateDiscountDto,
  ) {
    const customer = user
      ? await this.customers.findByFirebaseUid(user.uid)
      : null;
    return this.discounts.validateCode(
      body.code,
      body.subtotalKurus,
      customer?.id,
    );
  }

  @UseGuards(OptionalFirebaseAuthGuard)
  @Get('first-order-offer')
  async firstOrderOffer(@CurrentUser() user: DecodedIdToken | undefined) {
    const customer = user
      ? await this.customers.findByFirebaseUid(user.uid)
      : null;
    return this.discounts.getFirstOrderOffer(customer?.id);
  }
}
