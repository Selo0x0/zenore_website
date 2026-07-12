import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { StorageModule } from '../storage/storage.module';
import { ImagesAdminController } from './images-admin.controller';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';

@Module({
  imports: [StorageModule, CustomersModule],
  controllers: [ImagesController, ImagesAdminController],
  providers: [ImagesService],
})
export class ImagesModule {}
