import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { IsAdminGuard } from '../auth/is-admin.guard';
import { ReviewsService } from './reviews.service';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';

@Controller('admin/reviews')
@UseGuards(FirebaseAuthGuard, IsAdminGuard)
export class ReviewsAdminController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.reviews.listForAdmin(status);
  }

  @Patch(':id')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReviewStatusDto) {
    return this.reviews.updateStatus(id, dto.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviews.remove(id);
  }
}
