import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DealCardDto, SpaDetailForDealDto } from './deal-card.dto';

export class DealBreadcrumbItemDto {
  @ApiProperty() label!: string;
  @ApiProperty() url!: string;
}

export class DealVariantPriceDto {
  @ApiProperty() id!: number;
  @ApiProperty() priceType!: string;
  @ApiPropertyOptional() listPrice!: number | null;
  @ApiPropertyOptional() originalPrice!: number | null;
  @ApiPropertyOptional() salePrice!: number | null;
  @ApiProperty() currency!: string;
}

export class DealVariantDto {
  @ApiProperty() id!: number;
  @ApiProperty() nameVi!: string;
  @ApiPropertyOptional() nameEn!: string | null;
  @ApiPropertyOptional() nameKo!: string | null;
  @ApiPropertyOptional() durationMin!: number | null;
  @ApiPropertyOptional() pax!: number | null;
  @ApiPropertyOptional() descriptionVi!: string | null;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ type: DealVariantPriceDto, isArray: true }) prices!: DealVariantPriceDto[];
}

export class DealMediaDto {
  @ApiProperty() id!: number;
  @ApiProperty() mediaUrl!: string;
  @ApiProperty() mediaType!: string;
  @ApiProperty() sortOrder!: number;
}

export class DealLocalizedSlugsDto {
  @ApiProperty() vi!: string;
  @ApiPropertyOptional() en!: string | null;
  @ApiPropertyOptional() ko!: string | null;
}

export class DealDetailDto {
  @ApiProperty() id!: number;
  @ApiProperty() slug!: string;
  @ApiProperty({
    description: 'Slug chuẩn cho URL path (không có `#`); redirect khi path khác giá trị này',
  })
  canonicalSlug!: string;
  @ApiProperty({
    type: DealLocalizedSlugsDto,
    description: 'Slug theo từng locale để FE đổi URL khi switch ngôn ngữ',
  })
  localizedSlugs!: DealLocalizedSlugsDto;
  @ApiProperty() viewCount!: number;
  @ApiProperty({ description: 'Title đã pick theo lang param' }) title!: string;
  @ApiPropertyOptional({ description: 'Mô tả ngắn đã pick theo lang param' }) shortDescription!: string | null;
  @ApiPropertyOptional({ description: 'Nội dung đã pick theo lang param' }) content!: string | null;
  @ApiPropertyOptional() coverImageUrl!: string | null;
  @ApiPropertyOptional({ isArray: true, type: String, description: 'Danh sách ảnh banner' })
  photos!: string[];
  @ApiPropertyOptional() discountPercent!: string | null;
  @ApiProperty() currency!: string;
  @ApiPropertyOptional({ description: 'ISO 8601 — deals.start_at' }) startAt!: string | null;
  @ApiPropertyOptional({ description: 'ISO 8601 — deals.end_at' }) endAt!: string | null;
  @ApiPropertyOptional() start_at!: string | null;
  @ApiPropertyOptional() end_at!: string | null;
  @ApiProperty() isFlashSale!: boolean;
  @ApiPropertyOptional({ description: 'ISO string — flash sale kết thúc lúc' }) flashSaleEndsAt!: string | null;
  @ApiPropertyOptional({ description: 'Deal đã hết lượt' }) isSoldOut!: boolean;
  @ApiPropertyOptional({ description: 'Giờ áp dụng bắt đầu trong ngày, VD: "14:00"' }) applicableStartTime!: string | null;
  @ApiPropertyOptional({ description: 'Giờ áp dụng kết thúc trong ngày, VD: "15:00"' }) applicableEndTime!: string | null;
  @ApiPropertyOptional({ description: 'Khoảng giờ áp dụng dạng HH:mm-HH:mm' }) applicableTimeLabel!: string | null;
  @ApiPropertyOptional({ description: 'slug của service category' }) serviceSlug!: string | null;
  @ApiPropertyOptional({ type: DealBreadcrumbItemDto, isArray: true }) breadcrumbs!: DealBreadcrumbItemDto[];
  @ApiProperty({ type: SpaDetailForDealDto }) spa!: SpaDetailForDealDto;
  @ApiProperty({ type: DealVariantDto, isArray: true }) variants!: DealVariantDto[];
  @ApiProperty({ type: DealMediaDto, isArray: true }) media!: DealMediaDto[];
  @ApiPropertyOptional({ type: DealCardDto, isArray: true }) otherDealsAtSpa?: DealCardDto[];
}
