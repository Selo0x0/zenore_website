import { Body, Controller, Get, Param, Patch, Put, UseGuards } from '@nestjs/common';
import type { Prisma } from '@zenore/db';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { IsAdminGuard } from '../auth/is-admin.guard';
import { ContentService } from './content.service';

@Controller('admin')
@UseGuards(FirebaseAuthGuard, IsAdminGuard)
export class ContentAdminController {
  constructor(private readonly content: ContentService) {}

  @Put('site-content/:key')
  async upsertContent(@Param('key') key: string, @Body() body: Prisma.InputJsonValue) {
    return this.content.upsertContent(key, body);
  }

  @Get('contact-submissions')
  async getSubmissions() {
    return this.content.getContactSubmissions();
  }

  @Patch('contact-submissions/:id/read')
  async markAsRead(@Param('id') id: string) {
    return this.content.markAsRead(id);
  }
}
