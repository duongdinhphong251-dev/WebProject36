import { ApiProperty } from '@nestjs/swagger';
import type { PaginationMeta } from '../../../common/dto/pagination.dto';
import { ServiceResponseDto } from './service-response.dto';

export class AdminServiceListResponseDto {
  @ApiProperty({ type: ServiceResponseDto, isArray: true })
  data!: ServiceResponseDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: false,
    properties: {
      page: { type: 'number' },
      limit: { type: 'number' },
      total: { type: 'number' },
      totalPages: { type: 'number' },
    },
  })
  meta!: PaginationMeta;
}
