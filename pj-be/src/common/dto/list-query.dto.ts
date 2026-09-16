import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Tên field để sort (vd: nameVi, dealCount, priority)' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.ASC })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.ASC;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên (vi/en/ko) hoặc slug — dùng cho danh sách places theo quận',
  })
  @IsOptional()
  @IsString()
  q?: string;
}
