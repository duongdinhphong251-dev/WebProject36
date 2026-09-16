import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PhotoCacheModule } from '../../common/photo-cache/photo-cache.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminBannersController } from './admin-banners.controller';
import { BannerStorageService } from './banner-storage.service';
import { BasicAdminAuthGuard } from './basic-admin-auth.guard';
import { BannersService } from './banners.service';
import { PublicBannersController } from './public-banners.controller';

@Module({
  imports: [ConfigModule, PhotoCacheModule],
  controllers: [AdminAuthController, AdminBannersController, PublicBannersController],
  providers: [AdminAuthService, BannersService, BannerStorageService, BasicAdminAuthGuard],
  exports: [AdminAuthService, BasicAdminAuthGuard],
})
export class BannersModule {}
