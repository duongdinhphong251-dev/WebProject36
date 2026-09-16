import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlaceResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() slug!: string;
  @ApiProperty() nameVi!: string;
  @ApiPropertyOptional() nameEn!: string | null;
  @ApiPropertyOptional() nameKo!: string | null;
  @ApiPropertyOptional() cityId!: number | null;
  @ApiPropertyOptional() districtId!: number | null;
  @ApiPropertyOptional() wardId!: number | null;

  @ApiPropertyOptional({ description: 'Vĩ độ trung tâm địa điểm (WGS84), nếu có trong DB' })
  lat?: number | null;

  @ApiPropertyOptional({ description: 'Kinh độ trung tâm địa điểm (WGS84), nếu có trong DB' })
  lng?: number | null;
}
