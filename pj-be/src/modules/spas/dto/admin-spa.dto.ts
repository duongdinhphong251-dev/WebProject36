import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import type { PaginationMeta } from '../../../common/dto/pagination.dto';
import { ServiceResponseDto } from '../../services/dto/service-response.dto';

export class AdminSpaListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by spa name, slug, phone, website' })
  @IsOptional()
  @IsString()
  q?: string;
}

export class AdminSpaGalleryItemDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  imageUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  previewUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}

export class AdminSpaLocationInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cityId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  districtId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  wardId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  placeId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number | null;
}

export class AdminSpaLocationDetailDto extends AdminSpaLocationInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  citySlug?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cityName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  districtSlug?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  districtName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  placeSlug?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  placeName?: string | null;
}

export class UpsertAdminSpaDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  nameVi?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  nameEn?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  nameKo?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionVi?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionKo?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  province?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googlePlaceId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleMapsUri?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ratingValue?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  reviewCount?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messagingLinkZalo?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messagingLinkWhatsapp?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messagingLinkTelegram?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messagingLinkMessenger?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messagingLinkKakaotalk?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facebookLink?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instagramLink?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  twitterLink?: string | null;

  @ApiPropertyOptional({ type: Number, isArray: true })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  serviceIds?: number[];

  @ApiPropertyOptional({ description: 'JSON opening hours payload' })
  @IsOptional()
  @IsObject()
  openingHours?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'JSON reviews payload' })
  @IsOptional()
  @IsObject()
  reviews?: Record<string, unknown>[] | null;

  @ApiPropertyOptional({ description: 'JSON photos payload' })
  @IsOptional()
  @IsArray()
  photos?: Record<string, unknown>[] | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  spaAvatar?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  spaAvatarPreviewUrl?: string | null;

  @ApiPropertyOptional({ type: AdminSpaLocationInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminSpaLocationInputDto)
  location?: AdminSpaLocationInputDto | null;

  @ApiPropertyOptional({ type: AdminSpaGalleryItemDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminSpaGalleryItemDto)
  galleries?: AdminSpaGalleryItemDto[];
}

export class AdminSpaSummaryDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  phone!: string | null;

  @ApiPropertyOptional()
  website!: string | null;

  @ApiPropertyOptional()
  cityName!: string | null;

  @ApiPropertyOptional()
  districtName!: string | null;

  @ApiProperty()
  dealCount!: number;

  @ApiPropertyOptional()
  updatedAt!: Date | null;
}

export class AdminSpaDetailDto extends UpsertAdminSpaDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  slugVi!: string;

  @ApiProperty()
  slugEn!: string;

  @ApiProperty()
  slugKo!: string;

  @ApiProperty({ type: ServiceResponseDto, isArray: true })
  services!: ServiceResponseDto[];

  @ApiPropertyOptional({ type: AdminSpaLocationDetailDto })
  declare location: AdminSpaLocationDetailDto | null;

  @ApiPropertyOptional()
  createdAt!: Date | null;

  @ApiPropertyOptional()
  updatedAt!: Date | null;
}

export class AdminSpaListResponseDto {
  @ApiProperty({ type: AdminSpaSummaryDto, isArray: true })
  data!: AdminSpaSummaryDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: false,
    properties: {
      page: { type: 'number' },
      limit: { type: 'number' },
      total: { type: 'number' },
      totalPages: { type: 'number' },
    },
  })
  meta!: PaginationMeta;
}
