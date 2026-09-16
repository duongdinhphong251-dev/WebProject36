import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { ServiceResponseDto } from './dto/service-response.dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách danh mục dịch vụ. Sort: sortOrder, nameVi, code, slugGlobal' })
  @ApiOkResponse({ type: ServiceResponseDto, isArray: true })
  getServices(@Query() query: ListQueryDto) {
    return this.servicesService.getServices(query);
  }
}
