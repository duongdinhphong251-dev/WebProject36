import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { BasicAdminAuthGuard } from '../banners/basic-admin-auth.guard';
import { AdminServicesService } from './admin-services.service';
import { AdminServiceListResponseDto } from './dto/admin-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';

@ApiTags('admin-services')
@Controller('admin/services')
@UseGuards(BasicAdminAuthGuard)
export class AdminServicesController {
  constructor(private readonly adminServicesService: AdminServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Admin lookup for service categories' })
  @ApiOkResponse({ type: AdminServiceListResponseDto })
  list(@Query() query: ListQueryDto) {
    return this.adminServicesService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin service category detail' })
  @ApiOkResponse({ type: ServiceResponseDto })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.adminServicesService.getById(id);
  }
}
