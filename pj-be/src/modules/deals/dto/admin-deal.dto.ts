import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import type { PaginationMeta } from '../../../common/dto/pagination.dto';

export class AdminDealListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by title, slug, spa name' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  spaId?: string;
}

export class UpsertAdminDealDto {
  @ApiProperty()
  @IsUUID()
  spaId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  titleVi!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  titleEn!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  titleKo!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescriptionVi?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescriptionEn?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescriptionKo?: string | null;

  @ApiProperty()
  @IsString()
  contentVi!: string;

  @ApiProperty()
  @IsString()
  contentEn!: string;

  @ApiProperty()
  @IsString()
  contentKo!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImagePreviewUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isSoldOut?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priorityScore?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  discountPercent?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  discountedService?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priceRange?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  reportCount?: number | null;
}

export class AdminDealSummaryDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  spaId!: string;

  @ApiProperty()
  spaName!: string;

  @ApiPropertyOptional()
  status!: string | null;

  @ApiPropertyOptional()
  startAt!: Date | null;

  @ApiPropertyOptional()
  endAt!: Date | null;

  @ApiPropertyOptional()
  updatedAt!: Date | null;
}

export class AdminDealDetailDto extends UpsertAdminDealDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  slugVi!: string;

  @ApiPropertyOptional()
  spaName!: string | null;

  @ApiPropertyOptional()
  categoryName!: string | null;

  @ApiPropertyOptional()
  categorySlug!: string | null;

  @ApiPropertyOptional()
  slugEn!: string | null;

  @ApiPropertyOptional()
  slugKo!: string | null;

  @ApiPropertyOptional()
  createdAt!: Date | null;

  @ApiPropertyOptional()
  updatedAt!: Date | null;
}

export class AdminDealListResponseDto {
  @ApiProperty({ type: AdminDealSummaryDto, isArray: true })
  data!: AdminDealSummaryDto[];

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
