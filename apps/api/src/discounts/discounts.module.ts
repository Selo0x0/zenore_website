import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DiscountsAdminController } from './discounts-admin.controller';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';

@Module({
  imports: [PrismaModule, CustomersModule],
  controllers: [DiscountsController, DiscountsAdminController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
