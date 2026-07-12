import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { IsAdminGuard } from '../auth/is-admin.guard';
import { DiscountsService } from './discounts.service';

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
  create(@Body() body: Record<string, unknown>) {
    return this.discounts.create(body as any);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.discounts.update(id, body as any);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.discounts.remove(id);
  }
}
