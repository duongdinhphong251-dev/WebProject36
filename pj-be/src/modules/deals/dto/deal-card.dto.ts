import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OpeningPeriodDto } from '../../spas/dto/spa-detail.dto';

export class SpaContactForDealDto {
  @ApiPropertyOptional() phone!: string | null;
  @ApiPropertyOptional() zaloUrl!: string | null;
  @ApiPropertyOptional() facebookUrl!: string | null;
  @ApiPropertyOptional() telegramUrl!: string | null;
  @ApiPropertyOptional() reportUrl!: string | null;
}

export class SpaReviewForDealDto {
  @ApiProperty() id!: number | string;
  @ApiProperty() authorName!: string;
  @ApiProperty() ratingValue!: number;
  @ApiPropertyOptional() content!: string | null;
  @ApiPropertyOptional() createdAt!: string | null;
}

export class SpaBasicDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty() ratingValue!: number;
  @ApiProperty() reviewCount!: number;
  @ApiPropertyOptional() cityName!: string | null;
  @ApiPropertyOptional() distanceKm!: number | null;
  @ApiPropertyOptional({ description: 'Vĩ độ spa' }) lat!: number | null;
  @ApiPropertyOptional({ description: 'Kinh độ spa' }) lng!: number | null;
  @ApiPropertyOptional({
    description:
      'URL ảnh đại diện spa (ưu tiên avatar/GCS/cache). Không phải Places photo resource name.',
  })
  photoName!: string | null;
  @ApiPropertyOptional({ description: 'GCS avatar URL (direct link)' }) spaAvatarUrl!: string | null;
  @ApiPropertyOptional({
    description: 'Tổng lượt view/click trang spa — chỉ listing/category; deal detail không trả field này',
  })
  viewCount?: number;
  @ApiPropertyOptional({ type: OpeningPeriodDto, isArray: true })
  openingHours?: OpeningPeriodDto[] | null;
}

export class SpaDetailForDealDto extends SpaBasicDto {
  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Tên quận/huyện theo locale' }) districtName!: string | null;
  @ApiPropertyOptional({ description: 'Địa chỉ đầy đủ của spa' }) address!: string | null;
  @ApiProperty({ type: SpaContactForDealDto }) contact!: SpaContactForDealDto;
  @ApiProperty({ isArray: true, type: String, description: 'Top 5 signed photo URLs' }) photos!: string[];
  @ApiProperty({ isArray: true, type: SpaReviewForDealDto, description: 'Top 5 reviews cho JSON-LD' }) reviews!: SpaReviewForDealDto[];
}

export class DealCardDto {
  @ApiProperty() id!: number;
  @ApiProperty() slug!: string;
  @ApiProperty({
    description: 'Slug chuẩn cho URL path (không có `#`); dùng cho link /deals/{canonicalSlug}',
  })
  canonicalSlug!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() coverImageUrl!: string | null;
  @ApiPropertyOptional() originalPrice!: number | null;
  @ApiPropertyOptional() salePrice!: number | null;
  @ApiPropertyOptional() discountPercent!: string | null;
  @ApiProperty() currency!: string;
  @ApiPropertyOptional({ description: 'ISO 8601 — deals.start_at' }) startAt!: string | null;
  @ApiPropertyOptional({ description: 'ISO 8601 — deals.end_at' }) endAt!: string | null;
  @ApiPropertyOptional({ description: 'Alias snake_case của startAt' }) start_at!: string | null;
  @ApiPropertyOptional({ description: 'Alias snake_case của endAt' }) end_at!: string | null;
  @ApiProperty({ description: 'Deal đang trong khung giờ flash sale' })
  isFlashSale!: boolean;
  @ApiPropertyOptional({ description: 'Tag badge: "flash_sale" | null', example: 'flash_sale' })
  tag!: string | null;
  @ApiProperty({ type: SpaBasicDto }) spa!: SpaBasicDto;
}

export class SpaDealsGroupDto {
  @ApiProperty({ type: SpaBasicDto }) spa!: SpaBasicDto;
  @ApiProperty({ type: DealCardDto, isArray: true }) deals!: DealCardDto[];
}
