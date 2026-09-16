import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PhotoCacheModule } from '../../common/photo-cache/photo-cache.module';
import { BannersModule } from '../banners/banners.module';
import { TrackingModule } from '../tracking/tracking.module';
import { AdminDealsController } from './admin-deals.controller';
import { AdminDealsService } from './admin-deals.service';
import { DealCoverStorageService } from './deal-cover-storage.service';
import { DealsController } from './deals.controller';
import { FlashSalesController } from './flash-sales.controller';
import { DealsService } from './deals.service';

@Module({
  imports: [ConfigModule, TrackingModule, PhotoCacheModule, BannersModule],
  controllers: [DealsController, FlashSalesController, AdminDealsController],
  providers: [DealsService, AdminDealsService, DealCoverStorageService],
  exports: [DealsService],
})
export class DealsModule {}
