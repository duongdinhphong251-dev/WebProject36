import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiConsumes, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { BasicAdminAuthGuard } from '../banners/basic-admin-auth.guard';
import type { BannerUploadFile } from '../banners/banner-file.type';
import { AdminSpasService } from './admin-spas.service';
import { AdminSpaDetailDto, AdminSpaListQueryDto, AdminSpaListResponseDto, UpsertAdminSpaDto } from './dto/admin-spa.dto';

@ApiTags('admin-spas')
@ApiSecurity('basic')
@UseGuards(BasicAdminAuthGuard)
@Controller('admin/spas')
export class AdminSpasController {
  constructor(private readonly adminSpasService: AdminSpasService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách spa quản trị' })
  @ApiOkResponse({ type: AdminSpaListResponseDto })
  list(@Query() query: AdminSpaListQueryDto) {
    return this.adminSpasService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết spa quản trị' })
  @ApiOkResponse({ type: AdminSpaDetailDto })
  getById(@Param('id') id: string) {
    return this.adminSpasService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo spa mới' })
  @ApiOkResponse({ type: AdminSpaDetailDto })
  create(@Body() body: UpsertAdminSpaDto) {
    return this.adminSpasService.create(body);
  }

  @Post('gallery-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload ảnh gallery cho spa admin' })
  uploadGallery(@UploadedFile() file: BannerUploadFile) {
    return this.adminSpasService.uploadGalleryImage(file);
  }

  @Post('avatar-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload ảnh avatar cho spa admin' })
  uploadAvatar(@UploadedFile() file: BannerUploadFile) {
    return this.adminSpasService.uploadAvatarImage(file);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật spa' })
  @ApiOkResponse({ type: AdminSpaDetailDto })
  update(@Param('id') id: string, @Body() body: UpsertAdminSpaDto) {
    return this.adminSpasService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa spa' })
  remove(@Param('id') id: string) {
    return this.adminSpasService.remove(id);
  }
}
