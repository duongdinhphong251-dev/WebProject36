import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { BannerListQueryDto, BannerResponseDto, BANNER_LOCALES, BANNER_PLACEMENTS } from './dto/banner.dto';
import type { BannerLocale, BannerPlacement } from './dto/banner.dto';

@ApiTags('banners')
@Controller('banners')
export class PublicBannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách banner public cho FE' })
  @ApiOkResponse({ type: BannerResponseDto, isArray: true })
  list(@Query() query: BannerListQueryDto) {
    return this.bannersService.publicList(query.placement, query.locale, query.lat, query.lng);
  }
}
