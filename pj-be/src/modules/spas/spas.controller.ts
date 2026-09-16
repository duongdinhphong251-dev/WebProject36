import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { SpasService } from './spas.service';
import { SpaDetailDto } from './dto/spa-detail.dto';
import { RecommendedSpaDto } from './dto/recommended-spa.dto';

class RecommendedQueryDto {
  @IsOptional() @Type(() => Number) @IsNumber() lat?: number;
  @IsOptional() @Type(() => Number) @IsNumber() lng?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(50) limit?: number;
  /** Bán kính bbox (km) quanh user để lấy ứng viên trước khi sort Haversine; mặc định BE ~1200. */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(5000) radiusKm?: number;
  /** Nhãn tỉnh/thành trong `cityName` (vi/en/ko). Tên spa vẫn dùng slug/name chuẩn. */
  @IsOptional() @IsIn(['vi', 'en', 'ko']) locale?: 'vi' | 'en' | 'ko';
}

class SpaDetailQueryDto {
  @IsOptional() @IsIn(['vi', 'en', 'ko']) locale?: 'vi' | 'en' | 'ko';
  @IsOptional() @Type(() => Number) @IsNumber() lat?: number;
  @IsOptional() @Type(() => Number) @IsNumber() lng?: number;
}

@ApiTags('spas')
@Controller('spas')
export class SpasController {
  constructor(private readonly spasService: SpasService) {}

  @Get('recommended')
  @ApiOperation({
    summary: 'Danh sách spa gợi ý',
    description:
      'Không lat/lng: sort theo rating sao cao → thấp (tie-break số review). ' +
      'Có lat/lng: ưu tiên spa gần người dùng nhất; nếu cùng khoảng cách thì ưu tiên rating/review cao hơn. ' +
      'radiusKm là bbox sơ bộ (mặc định ~1200km).',
  })
  @ApiQuery({ name: 'lat', required: false, type: Number, example: 10.776889 })
  @ApiQuery({ name: 'lng', required: false, type: Number, example: 106.700806 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number, example: 1200 })
  @ApiQuery({
    name: 'locale',
    required: false,
    enum: ['vi', 'en', 'ko'],
    description: 'Chỉ ảnh hưởng nhãn `cityName` (tỉnh/thành); không đổi slug/tên spa.',
  })
  @ApiOkResponse({ type: RecommendedSpaDto, isArray: true })
  getRecommendedSpas(@Query() query: RecommendedQueryDto): Promise<RecommendedSpaDto[]> {
    return this.spasService.getRecommendedSpas(query);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Chi tiết spa — lookup bằng slug',
    description:
      'Trả đầy đủ: thông tin spa, vị trí, giờ mở cửa, deals đang active, ' +
      'reviews (top 10), gallery ảnh, thông tin liên hệ, breadcrumbs và khoảng cách (nếu truyền lat/lng).',
  })
  @ApiParam({ name: 'slug', description: 'Slug hoặc UUID của spa', example: 'bong-spa-cn1-massage' })
  @ApiQuery({
    name: 'locale',
    required: false,
    enum: ['vi', 'en', 'ko'],
    description: 'Deal (title/slug); nhãn tỉnh/quận trong location + breadcrumbs; tên spa luôn slug/name gốc.',
  })
  @ApiQuery({ name: 'lat', required: false, type: Number, description: 'Vĩ độ người dùng để tính khoảng cách', example: 10.776889 })
  @ApiQuery({ name: 'lng', required: false, type: Number, description: 'Kinh độ người dùng để tính khoảng cách', example: 106.700806 })
  @ApiOkResponse({ type: SpaDetailDto })
  @ApiNotFoundResponse({ description: 'Spa not found' })
  getSpaBySlug(
    @Param('slug') slug: string,
    @Query() query: SpaDetailQueryDto,
  ): Promise<SpaDetailDto> {
    return this.spasService.getSpaBySlug(slug, query);
  }
}
