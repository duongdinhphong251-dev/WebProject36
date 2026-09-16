import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SeoNodeType } from './seo-node-type.enum';

export class SeoUrlItemDto {
  @ApiProperty({
    description: 'Path segment (không có locale prefix). Dùng cho GET /pages/resolve?url=...',
    example: 'massage-ha-noi',
  })
  url!: string;

  @ApiProperty({ enum: ['vi', 'en', 'ko'], example: 'vi' })
  locale!: string;

  @ApiProperty({ enum: SeoNodeType, example: SeoNodeType.CITY })
  nodeType!: string;

  @ApiPropertyOptional({ example: 1 })
  categoryId?: number | null;

  @ApiPropertyOptional({ example: 1 })
  cityId?: number | null;

  @ApiPropertyOptional()
  districtId?: number | null;

  @ApiPropertyOptional()
  wardId?: number | null;

  @ApiPropertyOptional()
  placeId?: number | null;

  @ApiPropertyOptional({ example: 12 })
  dealCount?: number | null;

  @ApiPropertyOptional({ example: 5 })
  spaCount?: number | null;

  @ApiPropertyOptional()
  updatedAt?: string | null;
}
