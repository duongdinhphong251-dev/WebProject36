import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SpaDealsGroupDto } from '../../deals/dto/deal-card.dto';
import { FlashSaleDto } from '../../deals/dto/flash-sale.dto';
import { CityResponseDto } from '../../locations/dto/city-response.dto';
import { DistrictResponseDto } from '../../locations/dto/district-response.dto';
import { WardResponseDto } from '../../locations/dto/ward-response.dto';
import { PlaceResponseDto } from '../../locations/dto/place-response.dto';
import { ServiceResponseDto } from '../../services/dto/service-response.dto';

import type { PageType } from '../../url-resolver/dto/resolved-context';
export type { PageType };

export class BreadcrumbItemDto {
  @ApiProperty() label!: string;
  @ApiProperty() url!: string;
}

export class SeoMetaDto {
  @ApiProperty() h1!: string;
  @ApiProperty() title!: string;
  @ApiProperty() metaDescription!: string;
  @ApiProperty({ type: BreadcrumbItemDto, isArray: true }) breadcrumbs!: BreadcrumbItemDto[];
  @ApiProperty({ description: 'Có nên index trang này không' }) indexable!: boolean;
  @ApiPropertyOptional({
    description: 'Slug URL tương ứng khi đổi ngôn ngữ (vi dùng slug_vi, en/ko dùng slug_global)',
    example: { vi: 'massage-ho-chi-minh', en: 'massage-ho-chi-minh', ko: 'massage-ho-chi-minh' },
  })
  slugByLocale?: { vi: string; en: string; ko: string };
}

export class PaginationMetaDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export class PageDealsDto {
  @ApiProperty({ type: SpaDealsGroupDto, isArray: true }) data!: SpaDealsGroupDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class PageFiltersDto {
  @ApiProperty({ type: ServiceResponseDto, isArray: true }) services!: ServiceResponseDto[];
  @ApiPropertyOptional({ type: ServiceResponseDto }) currentService!: ServiceResponseDto | null;
  @ApiPropertyOptional({ type: ServiceResponseDto, isArray: true }) subServices?: ServiceResponseDto[];
  @ApiPropertyOptional({ type: Number, description: 'ID nhóm cha (40-47) của service hiện tại' }) parentGroupId?: number | null;

  @ApiProperty({ type: CityResponseDto, isArray: true }) cities!: CityResponseDto[];
  @ApiPropertyOptional({ type: CityResponseDto }) currentCity!: CityResponseDto | null;

  @ApiPropertyOptional({ type: DistrictResponseDto, isArray: true })
  districts!: DistrictResponseDto[] | null;
  @ApiPropertyOptional({ type: DistrictResponseDto }) currentDistrict!: DistrictResponseDto | null;

  @ApiPropertyOptional({ type: WardResponseDto, isArray: true })
  wards!: WardResponseDto[] | null;
  @ApiPropertyOptional({ type: WardResponseDto }) currentWard!: WardResponseDto | null;

  @ApiPropertyOptional({ type: PlaceResponseDto, isArray: true })
  places!: PlaceResponseDto[] | null;
  @ApiPropertyOptional({ type: PlaceResponseDto })
  currentPlace!: PlaceResponseDto | null;
}

export class PagePayloadDto {
  @ApiProperty({ enum: ['category', 'city', 'district', 'not_found'] })
  pageType!: PageType;
  @ApiPropertyOptional({ description: 'True khi payload đang ở hub flash-sale' })
  flashSaleHub?: boolean;

  @ApiProperty({ type: SeoMetaDto }) seoMeta!: SeoMetaDto;
  @ApiProperty({ type: PageDealsDto }) deals!: PageDealsDto;
  @ApiProperty({ type: FlashSaleDto }) flashSale!: FlashSaleDto;
  @ApiProperty({ type: PageFiltersDto }) filters!: PageFiltersDto;
}
