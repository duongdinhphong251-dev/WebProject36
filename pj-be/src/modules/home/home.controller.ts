import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { HomeService } from './home.service';
import { HeroBannerResponseDto, PromoBannerResponseDto } from './dto/banner-response.dto';

@ApiTags('home')
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('banners')
  @ApiOperation({ summary: 'Hero banners cho slider đầu trang' })
  @ApiQuery({ name: 'locale', required: false, enum: ['vi', 'en', 'ko'] })
  @ApiOkResponse({ type: HeroBannerResponseDto, isArray: true })
  getHeroBanners(@Query('locale') locale?: string) {
    return this.homeService.getHeroBanners(locale);
  }

  @Get('promo-banners')
  @ApiOperation({ summary: 'Promo banners đặt giữa các section. Field `position` cho biết đặt sau section nào.' })
  @ApiQuery({ name: 'locale', required: false, enum: ['vi', 'en', 'ko'] })
  @ApiOkResponse({ type: PromoBannerResponseDto, isArray: true })
  getPromoBanners(@Query('locale') locale?: string) {
    return this.homeService.getPromoBanners(locale);
  }
}
