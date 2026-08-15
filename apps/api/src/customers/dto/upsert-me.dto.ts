import { IsOptional, IsString } from 'class-validator';

export class UpsertMeDto {
  @IsOptional()
  @IsString()
  displayName?: string;
}
