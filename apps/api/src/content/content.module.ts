import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentAdminController } from './content-admin.controller';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  imports: [PrismaModule, CustomersModule, MailModule],
  controllers: [ContentController, ContentAdminController],
  providers: [ContentService],
})
export class ContentModule {}
