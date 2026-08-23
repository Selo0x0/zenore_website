import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PrismaModule, CustomersModule, DiscountsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
