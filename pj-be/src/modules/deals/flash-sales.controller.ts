import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { DealsService } from './deals.service';
import type { DealLocale } from './dto/deals-query.dto';
import { FlashSaleDto } from './dto/flash-sale.dto';

class FlashSalesQueryDto {
  @IsOptional() locale?: string;
  @IsOptional() @Type(() => Number) @IsNumber() lat?: number;
  @IsOptional() @Type(() => Number) @IsNumber() lng?: number;
  /** Bán kính tìm kiếm quanh user (km); mặc định 50km. */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(5000) radiusKm?: number;
}

@ApiTags('flash-sales')
@Controller('flash-sales')
export class FlashSalesController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @ApiOperation({
    summary: 'Flash sale đang active',
    description:
      'Trả top deals đang trong khung giờ flash sale. ' +
      'Không có lat/lng: sort theo discount % cao nhất (toàn quốc). ' +
      'Có lat/lng: chỉ lấy spa trong radiusKm (mặc định 50km), sort theo discount % cao nhất. ' +
      'Mỗi deal card có spa.cityName (tỉnh thành) và spa.distanceKm (nếu có geo).',
  })
  @ApiQuery({ name: 'locale', required: false, enum: ['vi', 'en', 'ko'], description: 'Ngôn ngữ title' })
  @ApiQuery({ name: 'lat', required: false, type: Number, description: 'Vĩ độ người dùng', example: 10.776889 })
  @ApiQuery({ name: 'lng', required: false, type: Number, description: 'Kinh độ người dùng', example: 106.700806 })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number, description: 'Bán kính tìm kiếm (km), mặc định 50', example: 50 })
  @ApiOkResponse({ type: FlashSaleDto })
  getFlashSales(@Query() query: FlashSalesQueryDto): Promise<FlashSaleDto> {
    return this.dealsService.getFlashSale({
      locale: query.locale as DealLocale,
      lat: query.lat,
      lng: query.lng,
      radiusKm: query.radiusKm,
    });
  }
}
