import { ApiProperty } from '@nestjs/swagger';

export class ExchangeRateDataDto {
  @ApiProperty({ example: 25400, description: 'Tỷ giá USD sang VND' })
  usdToVnd!: number;

  @ApiProperty({ example: 0.05433, description: 'Tỷ giá VND sang KRW (trực tiếp)' })
  vndToKrw!: number;

  @ApiProperty({ example: '2026-07-31T10:00:00Z', description: 'Thời điểm cập nhật tỷ giá gần nhất' })
  updatedAt!: string;
}

export class ExchangeRateResponseDto {
  @ApiProperty({ type: ExchangeRateDataDto })
  data!: ExchangeRateDataDto;
}
