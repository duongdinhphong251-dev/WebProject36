import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DealCardDto } from './deal-card.dto';

export class FlashSaleDto {
  @ApiProperty({ type: DealCardDto, isArray: true }) deals!: DealCardDto[];
  @ApiPropertyOptional({ description: 'Bắt đầu khung flash (ISO) — theo slot/ngày hoặc start_at nhóm' })
  startsAt!: string | null;
  @ApiPropertyOptional({ description: 'Thời điểm kết thúc khung flash (ISO), dùng cho countdown' })
  endsAt!: string | null;
  @ApiPropertyOptional({ description: 'Nhãn khung giờ hiển thị, ví dụ 21:00–22:00' })
  windowLabel!: string | null;
  @ApiPropertyOptional({ description: 'Độ dài khung áp dụng (phút), thường 60–120' })
  applicableDurationMinutes!: number | null;
  @ApiProperty({ description: 'Có đang trong khung giờ flash sale không' })
  isActive!: boolean;
  @ApiPropertyOptional({ description: 'Số giây còn lại đến khi flash sale kết thúc, null nếu không active' })
  countdownSeconds!: number | null;
}
