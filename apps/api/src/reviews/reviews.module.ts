import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomersModule } from '../customers/customers.module';
import { ProductReviewsController } from './product-reviews.controller';
import { ReviewsController } from './reviews.controller';
import { ReviewsAdminController } from './reviews-admin.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [PrismaModule, CustomersModule],
  controllers: [
    ProductReviewsController,
    ReviewsController,
    ReviewsAdminController,
  ],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
