import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { SEO_NODE_TYPES } from './seo-node-type.enum';

const SEO_LOCALES = ['vi', 'en', 'ko'] as const;

export class SeoUrlsQueryDto {
  @ApiPropertyOptional({
    description:
      'Lọc theo node_type. Nhiều giá trị cách nhau bởi dấu phẩy. ' +
      'Phase sitemap tỉnh: `category,city`',
    example: 'category,city',
  })
  @IsOptional()
  @IsString()
  nodeType?: string;

  @ApiPropertyOptional({
    description: 'Locale: `vi`, `en`, `ko` hoặc nhiều locale cách nhau bởi dấu phẩy. Bỏ trống = cả 3.',
    example: 'vi,en,ko',
  })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ description: 'Lọc theo category/service id', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Lọc theo city id (tỉnh/thành)', example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cityId?: number;

  @ApiPropertyOptional({ description: 'Lọc theo district id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  districtId?: number;

  @ApiPropertyOptional({ description: 'Lọc theo ward id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  wardId?: number;

  @ApiPropertyOptional({
    description: 'Chỉ lấy node có in_sitemap = true/false. Mặc định: true',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === true || value === 'true' || value === '1';
  })
  @IsBoolean()
  inSitemap?: boolean;

  @ApiPropertyOptional({
    description: 'Chỉ lấy node có indexable = true/false. Mặc định: true',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === true || value === 'true' || value === '1';
  })
  @IsBoolean()
  indexable?: boolean;

  @ApiPropertyOptional({
    description: 'publish_status trên seo_nodes. Mặc định: published',
    default: 'published',
    example: 'published',
  })
  @IsOptional()
  @IsString()
  publishStatus?: string;

  @ApiPropertyOptional({
    description: 'Chỉ lấy URL có deal_count >= giá trị này (sau khi đã recalc deal_count)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minDealCount?: number;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    default: 500,
    minimum: 1,
    maximum: 2000,
    description: 'Sitemap phase 1 (~1.5k URL) có thể dùng limit=2000, page=1',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  limit: number = 500;
}

/** Validates parsed CSV tokens (used in service after split). */
export function assertSeoNodeTypes(values: string[]): void {
  const invalid = values.filter((v) => !SEO_NODE_TYPES.includes(v as (typeof SEO_NODE_TYPES)[number]));
  if (invalid.length > 0) {
    throw new Error(`Invalid nodeType: ${invalid.join(', ')}. Allowed: ${SEO_NODE_TYPES.join(', ')}`);
  }
}

export function assertSeoLocales(values: string[]): void {
  const invalid = values.filter((v) => !SEO_LOCALES.includes(v as (typeof SEO_LOCALES)[number]));
  if (invalid.length > 0) {
    throw new Error(`Invalid locale: ${invalid.join(', ')}. Allowed: ${SEO_LOCALES.join(', ')}`);
  }
}

export { SEO_LOCALES };
