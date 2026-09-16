import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiConsumes, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { BasicAdminAuthGuard } from '../banners/basic-admin-auth.guard';
import type { BannerUploadFile } from '../banners/banner-file.type';
import { AdminDealsService } from './admin-deals.service';
import { AdminDealDetailDto, AdminDealListQueryDto, AdminDealListResponseDto, UpsertAdminDealDto } from './dto/admin-deal.dto';

@ApiTags('admin-deals')
@ApiSecurity('basic')
@UseGuards(BasicAdminAuthGuard)
@Controller('admin/deals')
export class AdminDealsController {
  constructor(private readonly adminDealsService: AdminDealsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách deal quản trị' })
  @ApiOkResponse({ type: AdminDealListResponseDto })
  list(@Query() query: AdminDealListQueryDto) {
    return this.adminDealsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết deal quản trị' })
  @ApiOkResponse({ type: AdminDealDetailDto })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.adminDealsService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo deal mới' })
  @ApiOkResponse({ type: AdminDealDetailDto })
  create(@Body() body: UpsertAdminDealDto) {
    return this.adminDealsService.create(body);
  }

  @Post('cover-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload ảnh cover cho deal admin' })
  uploadCover(@UploadedFile() file: BannerUploadFile) {
    return this.adminDealsService.uploadCoverImage(file);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật deal' })
  @ApiOkResponse({ type: AdminDealDetailDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpsertAdminDealDto) {
    return this.adminDealsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa deal' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminDealsService.remove(id);
  }
}
