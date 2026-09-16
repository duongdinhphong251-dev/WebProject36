import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export type DealLocale = 'vi' | 'en' | 'ko';

export enum DealSortOrder {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  RATING = 'rating',
  DISTANCE = 'distance',
  DISCOUNT_DESC = 'discount_desc',
}

export class DealsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'ho-chi-minh' })
  @IsOptional()
  @IsString()
  city_slug?: string;

  @ApiPropertyOptional({ example: 'quan-1' })
  @IsOptional()
  @IsString()
  district_slug?: string;

  @ApiPropertyOptional({ example: 'phuong-ben-nghe' })
  @IsOptional()
  @IsString()
  ward_slug?: string;

  @ApiPropertyOptional({ example: 'vincom-dong-khoi' })
  @IsOptional()
  @IsString()
  place_slug?: string;

  @ApiPropertyOptional({ example: 'massage', description: 'Slug của service category' })
  @IsOptional()
  @IsString()
  service_slug?: string;

  @ApiPropertyOptional({ example: 'XONG_HOI', description: 'Mã code chuẩn của service category' })
  @IsOptional()
  @IsString()
  service_code?: string;

  @ApiPropertyOptional({
    description: 'Chỉ lấy deal đang trong khung flash sale (slot hoặc start_at/end_at), không kết hợp service_slug',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  flash_sale_only?: boolean;

  @ApiPropertyOptional({ enum: DealSortOrder, default: DealSortOrder.RATING })
  @IsOptional()
  @IsEnum(DealSortOrder)
  sort?: DealSortOrder = DealSortOrder.RATING;

  @ApiPropertyOptional({ description: 'Vĩ độ người dùng (bật khi share location)', example: 10.776889 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Kinh độ người dùng', example: 106.700806 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ description: 'Giá sale tối thiểu (VND)', example: 100000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Giá sale tối đa (VND)', example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Rating tối thiểu của spa (1–5)', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ enum: ['vi', 'en', 'ko'], default: 'vi', description: 'Ngôn ngữ hiển thị title' })
  @IsOptional()
  @IsIn(['vi', 'en', 'ko'])
  locale?: DealLocale = 'vi';

  @ApiPropertyOptional({ description: 'Chỉ lọc các spa đang mở cửa ngay bây giờ', example: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  isOpenNow?: boolean;

  @ApiPropertyOptional({ description: 'Object các filter mở rộng theo extra_attributes' })
  @IsOptional()
  extraFilters?: Record<string, boolean>;
}
