import { IsBoolean, IsInt, IsOptional, Min, Max } from 'class-validator';

export class UpdateFirstOrderOfferDto {
  @IsInt()
  @Min(1)
  @Max(100)
  value!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderKurus?: number | null;

  @IsBoolean()
  isActive!: boolean;
}
