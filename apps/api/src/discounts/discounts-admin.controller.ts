import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { IsAdminGuard } from '../auth/is-admin.guard';
import { DiscountsService } from './discounts.service';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { UpdateDiscountCodeDto } from './dto/update-discount-code.dto';

@Controller('admin/discount-codes')
@UseGuards(FirebaseAuthGuard, IsAdminGuard)
export class DiscountsAdminController {
  constructor(private readonly discounts: DiscountsService) {}

  @Get()
  list(@Query('search') search?: string) {
    return this.discounts.list(search);
  }

  @Get('generate')
  generate() {
    return this.discounts.generateCode().then((code) => ({ code }));
  }

  @Post()
  create(@Body() dto: CreateDiscountCodeDto) {
    return this.discounts.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDiscountCodeDto) {
    return this.discounts.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.discounts.remove(id);
  }
}
