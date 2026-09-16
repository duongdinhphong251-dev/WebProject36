import { Module } from '@nestjs/common';
import { PhotoCacheService } from './photo-cache.service';
import { DbModule } from '../../db/db.module';

@Module({
  imports: [DbModule],
  providers: [PhotoCacheService],
  exports: [PhotoCacheService],
})
export class PhotoCacheModule {}
