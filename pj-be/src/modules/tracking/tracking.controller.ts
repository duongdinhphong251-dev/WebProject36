import { Body, Controller, Get, Ip, Param, Post, Headers, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import {
  RecordViewResponseDto,
  TrackClickBodyDto,
  TrackClickResponseDto,
  TrackViewResponseDto,
} from './dto/tracking.dto';

@ApiTags('tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('spa/:spaId/store-engagement')
  @ApiOperation({
    summary: 'Tổng tương tác cửa hàng (spa + deal của spa)',
    description:
      'Đếm view + click cho slug spa và mọi canonical slug deal thuộc spa (mở trang cửa hàng + mở/click deal).',
  })
  @ApiParam({ name: 'spaId', description: 'UUID spa' })
  @ApiOkResponse({ description: '{ viewCount: number }' })
  async getSpaStoreEngagement(
    @Param('spaId', ParseUUIDPipe) spaId: string,
  ): Promise<{ viewCount: number }> {
    const viewCount = await this.trackingService.getSpaStoreEngagementCount(spaId);
    return { viewCount };
  }

  @Post('view/:slug')
  @ApiOperation({
    summary: 'Ghi nhận lượt xem',
    description: 'Gọi khi user mở trang deal hoặc spa. entityType mặc định là "deal".',
  })
  @ApiParam({ name: 'slug', description: 'Slug của deal hoặc spa' })
  @ApiOkResponse({ type: RecordViewResponseDto })
  async recordView(
    @Param('slug') slug: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-entity-type') entityType?: string,
  ): Promise<RecordViewResponseDto> {
    const type = (entityType === 'spa' ? 'spa' : 'deal') as 'deal' | 'spa';
    const viewCount = await this.trackingService.recordView(slug, type, ip, userAgent);
    return { success: true, viewCount };
  }

  @Get('view/:slug')
  @ApiOperation({ summary: 'Lấy số lượt xem theo slug' })
  @ApiParam({ name: 'slug', description: 'Slug của deal hoặc spa' })
  @ApiOkResponse({ type: TrackViewResponseDto })
  async getViewCount(
    @Param('slug') slug: string,
    @Headers('x-entity-type') entityType?: string,
  ): Promise<TrackViewResponseDto> {
    const type = (entityType === 'spa' ? 'spa' : 'deal') as 'deal' | 'spa';
    const viewCount = await this.trackingService.getEngagementCount(slug, type);
    return { viewCount, slug, entityType: type };
  }

  @Post('click')
  @ApiOperation({
    summary: 'Ghi nhận lượt click',
    description: 'Gọi khi user click vào spa hoặc deal.',
  })
  @ApiBody({ type: TrackClickBodyDto })
  @ApiOkResponse({ type: TrackClickResponseDto })
  async recordClick(
    @Body() body: TrackClickBodyDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<TrackClickResponseDto> {
    if (body.slug) {
      const type = (body.entityType === 'spa' ? 'spa' : 'deal') as 'deal' | 'spa';
      await this.trackingService.recordClick(body.slug, type, ip, userAgent);
    }
    return { success: true };
  }
}
