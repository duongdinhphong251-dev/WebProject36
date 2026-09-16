import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() code!: string;
  @ApiProperty() nameVi!: string;
  @ApiPropertyOptional() nameEn!: string | null;
  @ApiPropertyOptional() nameKo!: string | null;
  @ApiPropertyOptional() slugVi!: string | null;
  @ApiPropertyOptional() slugEn!: string | null;
  @ApiPropertyOptional() slugKo!: string | null;
  @ApiProperty() slugGlobal!: string;
  @ApiProperty() sortOrder!: number;
  @ApiPropertyOptional() categoryId!: number | null;
  @ApiPropertyOptional({ description: 'SEO URL khi chọn service này trong context hiện tại' })
  targetUrl!: string | null;
}
