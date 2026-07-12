import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export const DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED'] as const;

export class CreateDiscountCodeDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsIn(DISCOUNT_TYPES)
  type!: (typeof DISCOUNT_TYPES)[number];

  @IsInt()
  @Min(1)
  value!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderKurus?: number | null;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
