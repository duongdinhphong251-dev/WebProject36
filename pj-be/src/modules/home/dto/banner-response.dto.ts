import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HeroBannerResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() slotKey!: string;
  @ApiPropertyOptional() title!: string | null;
  @ApiPropertyOptional() subtitle!: string | null;
  @ApiPropertyOptional() imageUrl!: string | null;
  @ApiPropertyOptional() dealId!: number | null;
  @ApiPropertyOptional() startAt!: Date | null;
  @ApiPropertyOptional() endAt!: Date | null;
}

export class PromoBannerResponseDto extends HeroBannerResponseDto {
  @ApiPropertyOptional({ description: 'Vị trí đặt banner, extract từ slot_key (vd: promo_after_flash → after_flash)' })
  position!: string | null;
}
