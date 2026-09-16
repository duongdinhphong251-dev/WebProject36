import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { FakeEngagementService } from './fake-engagement.service';

@Module({
  imports: [DbModule],
  controllers: [TrackingController],
  providers: [FakeEngagementService, TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
