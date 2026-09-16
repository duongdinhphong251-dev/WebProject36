import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PhotoCacheModule } from '../../common/photo-cache/photo-cache.module';
import { BannersModule } from '../banners/banners.module';
import { TrackingModule } from '../tracking/tracking.module';
import { AdminSpasController } from './admin-spas.controller';
import { AdminSpasService } from './admin-spas.service';
import { SpaAvatarStorageService } from './spa-avatar-storage.service';
import { SpaGalleryStorageService } from './spa-gallery-storage.service';
import { SpasController } from './spas.controller';
import { SpasService } from './spas.service';

@Module({
  imports: [ConfigModule, PhotoCacheModule, BannersModule, TrackingModule],
  controllers: [SpasController, AdminSpasController],
  providers: [SpasService, AdminSpasService, SpaAvatarStorageService, SpaGalleryStorageService],

})
export class SpasModule {}
