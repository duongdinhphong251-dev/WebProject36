import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DistrictResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() slug!: string;
  @ApiProperty() nameVi!: string;
  @ApiPropertyOptional() nameEn!: string | null;
  @ApiPropertyOptional() nameKo!: string | null;
  @ApiProperty() cityId!: number;

  @ApiPropertyOptional({ description: 'SEO URL khi chọn district này trong context hiện tại' })
  targetUrl!: string | null;
}
