import { Body, Controller, Post } from '@nestjs/common';
import { DiscountsService } from './discounts.service';

class ValidateDiscountDto {
  code!: string;
  subtotalKurus!: number;
}

@Controller('discount-codes')
export class DiscountsController {
  constructor(private readonly discounts: DiscountsService) {}

  @Post('validate')
  validate(@Body() body: ValidateDiscountDto) {
    return this.discounts.validateCode(body.code, body.subtotalKurus);
  }
}
