import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DiscountsService } from './discounts.service';

class ValidateDiscountDto {
  code!: string;
  subtotalKurus!: number;
}

@Controller('discount-codes')
export class DiscountsController {
  constructor(private readonly discounts: DiscountsService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('validate')
  validate(@Body() body: ValidateDiscountDto) {
    return this.discounts.validateCode(body.code, body.subtotalKurus);
  }
}
