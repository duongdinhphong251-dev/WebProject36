import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { DealSortOrder } from '../../deals/dto/deals-query.dto';

export enum PageLocale {
  VI = 'vi',
  EN = 'en',
  KO = 'ko',
}

export class PageResolveQueryDto {
  @ApiProperty({
    description: 'URL path cần resolve, ví dụ: /massage/ha-noi/quan-1',
    example: '/massage/ho-chi-minh',
  })
  @IsString()
  url!: string;

  @ApiPropertyOptional({ enum: PageLocale, default: PageLocale.VI })
  @IsOptional()
  @IsEnum(PageLocale)
  locale?: PageLocale = PageLocale.VI;

  @ApiPropertyOptional({ description: 'Vĩ độ người dùng (để sort gần nhất)', example: 10.776889 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: 106.700806 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: DealSortOrder, description: 'Sắp xếp: rating | price_asc | price_desc | distance | discount_desc' })
  @IsOptional()
  @IsEnum(DealSortOrder)
  sort?: DealSortOrder;

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


  @ApiPropertyOptional({ description: 'Lọc theo địa điểm cụ thể (place slug)', example: 'vincom-dong-khoi' })
  @IsOptional()
  @IsString()
  place_slug?: string;
  @ApiPropertyOptional({ description: 'Rating tối thiểu của spa (1–5)', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Chỉ lọc các spa đang mở cửa ngay bây giờ', example: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  isOpenNow?: boolean;
}

