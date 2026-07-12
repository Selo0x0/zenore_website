import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateDiscountCodeDto } from './create-discount-code.dto';

export class UpdateDiscountCodeDto extends PartialType(
  OmitType(CreateDiscountCodeDto, ['code'] as const),
) {}
