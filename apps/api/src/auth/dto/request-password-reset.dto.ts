import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  continueUrl?: string;
}
