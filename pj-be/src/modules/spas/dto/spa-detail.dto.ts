import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceResponseDto } from '../../services/dto/service-response.dto';

export class SpaBreadcrumbItemDto {
  @ApiProperty({ description: 'Nhãn hiển thị' }) label!: string;
  @ApiProperty({ description: 'URL đường dẫn' }) url!: string;
}

export class SpaLocationDto {
  @ApiPropertyOptional() addressLine!: string | null;
  @ApiPropertyOptional({ description: 'Theo query `locale` trên GET /spas/:slug (mặc định vi)' })
  cityName!: string | null;
  @ApiPropertyOptional({ description: 'Theo query `locale` (mặc định vi)' })
  districtName!: string | null;
  @ApiPropertyOptional() lat!: number | null;
  @ApiPropertyOptional() lng!: number | null;
}

export class OpeningPeriodDto {
  @ApiProperty({ description: '0=Sun, 1=Mon, ..., 6=Sat' }) day!: number;
  @ApiProperty({ example: '09:00' }) openTime!: string;
  @ApiProperty({ example: '22:00' }) closeTime!: string;
}

export class SpaContactDto {
  @ApiPropertyOptional() phone!: string | null;
  @ApiPropertyOptional() zalo!: string | null;
  @ApiPropertyOptional() facebook!: string | null;
  @ApiPropertyOptional() instagram!: string | null;
  @ApiPropertyOptional() messenger!: string | null;
  @ApiPropertyOptional() telegram!: string | null;
  @ApiPropertyOptional() whatsapp!: string | null;
  @ApiPropertyOptional() kakaotalk!: string | null;
}

export class SpaDealDto {
  @ApiProperty() id!: number;
  @ApiProperty() slug!: string;
  @ApiProperty({
    description: 'Slug chuẩn cho URL path (không có `#`); ưu tiên khi build link deal',
  })
  canonicalSlug!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() discountPercent!: string | null;
  @ApiPropertyOptional() salePrice!: number | null;
  @ApiPropertyOptional() originalPrice!: number | null;
  @ApiProperty() currency!: string;
  @ApiPropertyOptional({ description: 'ISO 8601 — deals.start_at' }) startAt!: string | null;
  @ApiPropertyOptional({ description: 'ISO 8601 — deals.end_at' }) endAt!: string | null;
  @ApiPropertyOptional() start_at!: string | null;
  @ApiPropertyOptional() end_at!: string | null;
  @ApiProperty() isFlashSale!: boolean;
  @ApiPropertyOptional({ description: 'Giờ áp dụng bắt đầu trong ngày, VD: "10:00"' }) applicableStartTime!: string | null;
  @ApiPropertyOptional({ description: 'Giờ áp dụng kết thúc trong ngày, VD: "15:00"' }) applicableEndTime!: string | null;
  @ApiPropertyOptional({ description: 'Khoảng giờ áp dụng dạng HH:mm-HH:mm, VD: "10:00-15:00"' }) applicableTimeLabel!: string | null;
  @ApiPropertyOptional({ description: 'Thời lượng dịch vụ tính bằng phút (từ deal_variants)' }) durationMin?: number | null;
  @ApiPropertyOptional({ description: 'Mô tả ngắn tiếng Việt' }) shortDescriptionVi?: string | null;
  @ApiPropertyOptional({ description: 'Mô tả ngắn tiếng Anh' }) shortDescriptionEn?: string | null;
  @ApiPropertyOptional({ description: 'Mô tả ngắn tiếng Hàn' }) shortDescriptionKo?: string | null;
  @ApiPropertyOptional({ description: 'ID dịch vụ/category chính (services.id)' }) categoryId?: number | null;
}

export class SpaReviewOwnerReplyDto {
  @ApiProperty() content!: string;
  @ApiPropertyOptional() repliedAt!: string | null;
}

export class SpaReviewDto {
  @ApiProperty() id!: number | string;
  @ApiProperty() authorName!: string;
  @ApiPropertyOptional() authorAvatarUrl!: string | null;
  @ApiProperty() rating!: number;
  @ApiPropertyOptional() content!: string | null;
  @ApiPropertyOptional() reviewedAt!: string | null;
  @ApiPropertyOptional({ type: [String], description: 'Ảnh kèm review (từ raw_payload khi có)' })
  photoUrls?: string[];
  @ApiPropertyOptional({ description: 'Số lượt thích của review' })
  likeCount?: number;
  @ApiPropertyOptional({ type: SpaReviewOwnerReplyDto })
  ownerReply?: SpaReviewOwnerReplyDto | null;
  @ApiPropertyOptional({ description: 'Link đến review trên Google Maps (null nếu không có trong raw_payload)' })
  googleMapsUri?: string | null;
  @ApiPropertyOptional({
    description:
      'Google Place ID (ChIJ…) — từ spas.google_place_id hoặc parse từ raw_payload.name (places/{id}/reviews/…)',
  })
  googlePlaceId?: string | null;
  @ApiPropertyOptional({ description: 'Mã ngôn ngữ review (vi, en, ko, ...)' })
  languageCode?: string | null;
  @ApiPropertyOptional({ description: 'Nguồn review' })
  source?: string | null;
  @ApiPropertyOptional({ description: 'URL bài viết (nếu có, vd từ Reddit)' })
  postUrl?: string | null;
}

export class SpaLocalizedSlugsDto {
  @ApiProperty() vi!: string;
  @ApiProperty() en!: string;
  @ApiProperty() ko!: string;
}

export class SpaServiceItemDto {
  @ApiPropertyOptional() id?: string;
  @ApiProperty({ description: 'Tên dịch vụ' }) serviceName!: string;
  @ApiPropertyOptional() originalPrice?: number | null;
  @ApiPropertyOptional() discountPrice?: number | null;
  @ApiPropertyOptional() durationMinutes?: number | null;
  @ApiPropertyOptional() packageInfo?: string | null;
}

export class SpaDetailDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({
    type: SpaLocalizedSlugsDto,
    description: 'Slug theo từng locale để FE đổi URL khi switch ngôn ngữ',
  })
  localizedSlugs!: SpaLocalizedSlugsDto;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description!: string | null;
  @ApiPropertyOptional() address!: string | null;
  @ApiPropertyOptional({ description: 'GCS avatar URL' }) spaAvatarUrl!: string | null;
  @ApiProperty() ratingValue!: number;
  @ApiProperty() reviewCount!: number;
  @ApiPropertyOptional() googleMapsUri!: string | null;
  @ApiPropertyOptional({
    description: 'Google Place ID (ChIJ…) — cột spas.google_place_id',
  })
  googlePlaceId?: string | null;

  @ApiPropertyOptional({ type: [String] }) amenities?: string[] | null;
  @ApiPropertyOptional({ type: [String] }) amenities_en?: string[] | null;
  @ApiPropertyOptional({ type: [String] }) amenities_ko?: string[] | null;

  @ApiProperty({ type: SpaLocationDto }) location!: SpaLocationDto;
  @ApiProperty({ type: SpaContactDto }) contact!: SpaContactDto;
  @ApiProperty({ type: OpeningPeriodDto, isArray: true }) openingHours!: OpeningPeriodDto[];

  @ApiProperty({ type: SpaDealDto, isArray: true }) deals!: SpaDealDto[];
  @ApiPropertyOptional({ type: SpaServiceItemDto, isArray: true, description: 'Danh sách dịch vụ trích xuất từ bảng giá OCR' })
  serviceItems?: SpaServiceItemDto[];
  @ApiProperty({ type: ServiceResponseDto, isArray: true })
  services!: ServiceResponseDto[];
  @ApiProperty({ type: SpaReviewDto, isArray: true, description: 'Top 10 reviews gần nhất' })
  reviews!: SpaReviewDto[];

  @ApiProperty({
    isArray: true,
    type: String,
    description: 'Ảnh carousel: spas.spa_avatar (nếu có) + spa_galleries.image_url theo sort_order',
  })
  photos!: string[];

  @ApiProperty({ type: SpaBreadcrumbItemDto, isArray: true, description: 'Breadcrumbs: Trang chủ → City → District → Spa' })
  breadcrumbs!: SpaBreadcrumbItemDto[];

  @ApiPropertyOptional({ description: 'Khoảng cách từ vị trí người dùng đến spa (km), null nếu không truyền lat/lng' })
  distanceKm!: number | null;
}

