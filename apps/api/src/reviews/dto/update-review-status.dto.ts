import { IsIn } from 'class-validator';

export const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export class UpdateReviewStatusDto {
  @IsIn(REVIEW_STATUSES)
  status!: (typeof REVIEW_STATUSES)[number];
}
