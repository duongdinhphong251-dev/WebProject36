import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CityResponseDto } from './dto/city-response.dto';
import { DistrictResponseDto } from './dto/district-response.dto';
import { PlaceResponseDto } from './dto/place-response.dto';
import { WardResponseDto } from './dto/ward-response.dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('cities')
  @ApiOperation({ summary: 'Danh sách tỉnh/thành phố. Sort: priority, nameVi, slug' })
  @ApiOkResponse({ type: CityResponseDto, isArray: true })
  getCities(@Query() query: ListQueryDto) {
    return this.locationsService.getCities(query);
  }

  @Get('cities/:slug/districts')
  @ApiOperation({ summary: 'Danh sách quận/huyện theo tỉnh/thành. Sort: priority, nameVi, slug' })
  @ApiParam({ name: 'slug', example: 'ho-chi-minh' })
  @ApiOkResponse({ type: DistrictResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'City not found' })
  getDistrictsByCitySlug(@Param('slug') slug: string, @Query() query: ListQueryDto) {
    return this.locationsService.getDistrictsByCitySlug(slug, query);
  }

  @Get('districts/:slug/wards')
  @ApiOperation({ summary: 'Danh sách phường/xã theo quận/huyện. Sort: priority, nameVi, slug' })
  @ApiParam({ name: 'slug', example: 'quan-1' })
  @ApiOkResponse({ type: WardResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'District not found' })
  getWardsByDistrictSlug(@Param('slug') slug: string, @Query() query: ListQueryDto) {
    return this.locationsService.getWardsByDistrictSlug(slug, query);
  }

  @Get('districts/:districtSlug/places')
  @ApiOperation({
    summary: 'Danh sách địa điểm (đường/phố) trong quận/huyện',
    description:
      'Trả tất cả places trong quận (không lọc spa/deal active). ' +
      'Phân trang DB: `page`, `limit`. Tìm kiếm: `q` (tên vi/en/ko, slug). ' +
      'Response: `{ data, meta }`.',
  })
  @ApiParam({ name: 'districtSlug', example: 'quan-1' })
  @ApiOkResponse({ type: PlaceResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'District not found' })
  getPlacesByDistrictSlug(@Param('districtSlug') districtSlug: string, @Query() query: ListQueryDto) {
    return this.locationsService.getPlacesByDistrictSlug(districtSlug, query);
  }
}
