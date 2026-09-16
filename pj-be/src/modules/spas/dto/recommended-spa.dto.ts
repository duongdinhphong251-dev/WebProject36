import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OpeningPeriodDto } from './spa-detail.dto';

export class RecommendedSpaBestDealDto {
  @ApiProperty() id!: number;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() canonicalSlug!: string;
  @ApiPropertyOptional() salePrice!: number | null;
  @ApiPropertyOptional() originalPrice!: number | null;
  @ApiPropertyOptional() discountPercent!: string | null;
  @ApiPropertyOptional() currency!: string;
}

export class RecommendedSpaDto {
  @ApiProperty({ description: 'UUID của spa' }) id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty() ratingValue!: number;
  @ApiProperty() reviewCount!: number;
  @ApiPropertyOptional({ description: 'Google Places photo reference (name field)' })
  photoName!: string | null;
  @ApiPropertyOptional({ description: 'GCS avatar URL (direct link)' })
  spaAvatarUrl!: string | null;
  @ApiPropertyOptional({ description: 'Tên tỉnh/thành (theo query `locale`, mặc định vi)' })
  cityName!: string | null;
  @ApiProperty({ description: 'Số deal đang active của spa' }) activeDealCount!: number;
  @ApiPropertyOptional({ description: 'Khoảng cách tới user (km), chỉ có khi truyền lat/lng' })
  distanceKm!: number | null;
  @ApiPropertyOptional({ description: 'Số lượt xem thực (nếu không có thì bằng 0 hoặc null)' })
  viewCount?: number | null;
  @ApiPropertyOptional({ type: [OpeningPeriodDto], description: 'Giờ mở cửa thực tế từ DB' })
  openingHours?: OpeningPeriodDto[] | null;
  @ApiPropertyOptional({ type: RecommendedSpaBestDealDto, description: 'Ưu đãi nổi bật thực trong DB' })
  bestDeal?: RecommendedSpaBestDealDto | null;
}

