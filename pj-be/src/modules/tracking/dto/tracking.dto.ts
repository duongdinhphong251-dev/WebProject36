import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackViewResponseDto {
  @ApiProperty({ description: 'Tổng mở trang + click (view + click) cho slug + loại entity' })
  viewCount!: number;
  @ApiProperty({ description: 'Slug của entity' }) slug!: string;
  @ApiProperty({ description: 'Loại entity: deal | spa' }) entityType!: string;
}

export class RecordViewResponseDto {
  @ApiProperty() success!: boolean;
  @ApiProperty() viewCount!: number;
}

export class TrackClickResponseDto {
  @ApiProperty() success!: boolean;
}

export class TrackClickBodyDto {
  @ApiPropertyOptional({ description: 'Slug của entity' }) slug?: string;
  @ApiPropertyOptional({ description: 'Loại entity: deal | spa' }) entityType?: string;
}
