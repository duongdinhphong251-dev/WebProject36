import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CityResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() slug!: string;
  @ApiProperty() nameVi!: string;
  @ApiPropertyOptional() nameEn!: string | null;
  @ApiPropertyOptional() nameKo!: string | null;
  @ApiProperty() priority!: number;

  @ApiPropertyOptional({ description: 'SEO URL khi chọn city này trong context hiện tại' })
  targetUrl!: string | null;
}
