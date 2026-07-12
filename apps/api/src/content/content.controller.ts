import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ContentService } from './content.service';

class SubmitContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message!: string;
}

@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('site-content/:key')
  async getContent(@Param('key') key: string) {
    const value = await this.content.getContent(key);
    if (value === null) throw new NotFoundException();
    return value;
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('contact')
  async submitContact(@Body() body: SubmitContactDto) {
    return this.content.submitContact(body);
  }
}
