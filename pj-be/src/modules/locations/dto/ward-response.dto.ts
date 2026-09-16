import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WardResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() slug!: string;
  @ApiProperty() nameVi!: string;
  @ApiPropertyOptional() nameEn!: string | null;
  @ApiPropertyOptional() nameKo!: string | null;
  @ApiProperty() districtId!: number;
  @ApiProperty() cityId!: number;
}
