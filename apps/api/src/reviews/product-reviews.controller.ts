import { Controller, Get, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('products/:slug/reviews')
export class ProductReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  listForProduct(@Param('slug') slug: string) {
    return this.reviews.listApprovedForProduct(slug);
  }
}
