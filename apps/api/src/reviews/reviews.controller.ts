import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CustomersService } from '../customers/customers.service';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
@UseGuards(FirebaseAuthGuard)
export class ReviewsController {
  constructor(
    private readonly reviews: ReviewsService,
    private readonly customers: CustomersService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post()
  async create(
    @CurrentUser() user: DecodedIdToken,
    @Body() dto: CreateReviewDto,
  ) {
    const customer = await this.customers.findByFirebaseUid(user.uid);
    return this.reviews.create(customer.id, dto);
  }
}
