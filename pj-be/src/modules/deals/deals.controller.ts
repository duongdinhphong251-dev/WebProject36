import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { DealLookupParamPipe } from '../../common/pipes/deal-lookup-param.pipe';
import { DealsService } from './deals.service';
import type { DealLocale } from './dto/deals-query.dto';
import { DealsQueryDto } from './dto/deals-query.dto';
import { SpaDealsGroupDto } from './dto/deal-card.dto';
import { DealDetailDto } from './dto/deal-detail.dto';
import { FlashSaleDto } from './dto/flash-sale.dto';

class FlashSaleQueryDto {
  @IsOptional() locale?: string;
  @IsOptional() @Type(() => Number) @IsNumber() lat?: number;
  @IsOptional() @Type(() => Number) @IsNumber() lng?: number;
  /** Bán kính tìm kiếm quanh user (km); mặc định 50km. */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(5000) radiusKm?: number;
}

@ApiTags('deals')
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @ApiOperation({
    summary: 'Danh sách deals nhóm theo spa',
    description:
      'Mỗi spa hiển thị tối đa 2 deals có discount cao nhất. ' +
      'Sort mặc định theo rating; nếu truyền lat/lng thì sort theo khoảng cách.',
  })
  @ApiOkResponse({ type: SpaDealsGroupDto, isArray: true })
  getDeals(@Query() query: DealsQueryDto) {
    return this.dealsService.getDeals(query);
  }

  @Get('flash-sale')
  @ApiOperation({
    summary: 'Danh sách deals đang trong khung giờ flash sale',
    description:
      'Top 10 deals có discount cao nhất đang active tại thời điểm hiện tại. ' +
      'Có lat/lng: chỉ trả deals của spa nằm trong radiusKm (mặc định 50km) tính từ vị trí người dùng.',
  })
  @ApiQuery({ name: 'locale', required: false, enum: ['vi', 'en', 'ko'], description: 'Ngôn ngữ hiển thị title' })
  @ApiQuery({ name: 'lat', required: false, type: Number, description: 'Vĩ độ người dùng', example: 10.776889 })
  @ApiQuery({ name: 'lng', required: false, type: Number, description: 'Kinh độ người dùng', example: 106.700806 })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number, description: 'Bán kính tìm kiếm (km), mặc định 50', example: 50 })
  @ApiOkResponse({ type: FlashSaleDto })
  getFlashSale(@Query() query: FlashSaleQueryDto): Promise<FlashSaleDto> {
    return this.dealsService.getFlashSale({
      locale: query.locale as DealLocale,
      lat: query.lat,
      lng: query.lng,
      radiusKm: query.radiusKm,
    });
  }

  @Get(':idOrSlug')
  @ApiOperation({
    summary: 'Chi tiết deal — lookup bằng ID hoặc slug',
    description:
      'Tự động detect: nếu param là số → tìm theo id; ngược lại → tìm theo slug. ' +
      'Truyền lang để nhận slug và nội dung tương ứng ngôn ngữ (vi/en/ko).',
  })
  @ApiParam({ name: 'idOrSlug', description: 'Deal ID (số) hoặc slug', example: 'massage-thu-gian-60-phut' })
  @ApiQuery({ name: 'lang', required: false, enum: ['vi', 'en', 'ko'], description: 'Ngôn ngữ — ảnh hưởng slug và title trả về' })
  @ApiOkResponse({ type: DealDetailDto })
  @ApiNotFoundResponse({ description: 'Deal not found' })
  getDealByIdOrSlug(
    @Param('idOrSlug', DealLookupParamPipe) idOrSlug: string,
    @Query('lang') lang?: string,
  ): Promise<DealDetailDto> {
    return this.dealsService.getDealByIdOrSlug(idOrSlug, lang as DealLocale);
  }
}
