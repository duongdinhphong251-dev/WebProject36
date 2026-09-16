import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ScheduleModule } from '@nestjs/schedule';
import { DbModule } from './db/db.module';
import { LocationsModule } from './modules/locations/locations.module';
import { ServicesModule } from './modules/services/services.module';
import { DealsModule } from './modules/deals/deals.module';
import { SpasModule } from './modules/spas/spas.module';
import { PagesModule } from './modules/pages/pages.module';
import { HomeModule } from './modules/home/home.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { SeoModule } from './modules/seo/seo.module';
import { SearchModule } from './modules/search/search.module';
import { BannersModule } from './modules/banners/banners.module';
import { ExchangeRateModule } from './modules/exchange-rate/exchange-rate.module';


@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_NAME: Joi.string().required(),
        DB_USER: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        /** Số connection tối đa mỗi process Nest (mặc định 5). Tổng ≈ DB_POOL_MAX × số instance Cloud Run. */
        DB_POOL_MAX: Joi.number().integer().min(1).max(50).default(5),
        /** Timeout fail-fast cho kết nối/boot DB local-dev, tính bằng ms. */
        DB_BOOT_TIMEOUT_MS: Joi.number().integer().min(1000).max(120000).default(5000),
        /** Bật/tắt migrate lúc app boot. Local offline có thể tắt để tránh treo startup. */
        DB_RUN_MIGRATIONS: Joi.string().optional(),
        /** Bật/tắt schema bootstrap lúc app boot. */
        DB_BOOTSTRAP_SCHEMA: Joi.string().optional(),
        // Google Maps + GCS (optional — photo caching disabled if not set)
        GOOGLE_MAPS_API_KEY: Joi.string().optional(),
        GCS_BUCKET_NAME: Joi.string().optional(),
        /** Bucket ảnh crawl legacy (vd. spa_images). Để trống = tắt ký bucket này. Không set = mặc định spa_images. */
        GCS_LEGACY_SPA_IMAGES_BUCKET: Joi.string().optional().allow(''),
        GCS_KEY_FILE: Joi.string().optional(),
        /** GCS V4 signed URL TTL — mặc định 72h (259200s). */
        SIGNED_URL_TTL_SECONDS: Joi.number().default(259_200),
        /** Bật cộng fake engagement (yes/true/1 — mặc định; no/false/0 tắt). */
        FAKE_ENGAGEMENT_ENABLED: Joi.string().optional(),
        ADMIN_BASIC_AUTH_USERNAME: Joi.string().optional().allow(''),
        ADMIN_BASIC_AUTH_PASSWORD: Joi.string().optional().allow(''),
        ADMIN_SESSION_SECRET: Joi.string().optional().allow(''),
        EXCHANGE_RATE_API_URL: Joi.string().optional(),
      }),
    }),
    DbModule,
    LocationsModule,
    ServicesModule,
    DealsModule,
    SpasModule,
    PagesModule,
    HomeModule,
    TrackingModule,
    SeoModule,
    SearchModule,
    BannersModule,
    ExchangeRateModule,
  ],
})
export class AppModule { }
