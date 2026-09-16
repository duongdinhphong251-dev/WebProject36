import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BannersModule } from '../banners/banners.module';
import { AdminServicesController } from './admin-services.controller';
import { AdminServicesService } from './admin-services.service';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [ConfigModule, BannersModule],
  controllers: [ServicesController, AdminServicesController],
  providers: [ServicesService, AdminServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
