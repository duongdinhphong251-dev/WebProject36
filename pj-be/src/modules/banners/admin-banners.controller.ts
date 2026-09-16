import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { BasicAdminAuthGuard } from './basic-admin-auth.guard';
import type { BannerUploadFile } from './banner-file.type';
import { BannersService } from './banners.service';
import { BannerListQueryDto, BannerResponseDto, ReorderBannersDto, UpsertBannerDto } from './dto/banner.dto';

type BannerUploadFields = {
  imageVi?: BannerUploadFile[];
  imageEn?: BannerUploadFile[];
  imageKo?: BannerUploadFile[];
};

@ApiTags('admin-banners')
@ApiSecurity('basic')
@UseGuards(BasicAdminAuthGuard)
@Controller('admin/banners')
export class AdminBannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get('auth-check')
  @ApiOperation({ summary: 'Kiểm tra basic auth cho admin' })
  authCheck() {
    return { success: true };
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách banner quản trị' })
  @ApiQuery({ name: 'placement', required: false, enum: ['home_slot', 'breadcrumb'] })
  @ApiOkResponse({ type: BannerResponseDto, isArray: true })
  list(@Query() query: BannerListQueryDto) {
    return this.bannersService.list(query);
  }

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'imageVi', maxCount: 1 },
    { name: 'imageEn', maxCount: 1 },
    { name: 'imageKo', maxCount: 1 },
  ]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Tạo banner mới' })
  @ApiBody({ type: UpsertBannerDto })
  @ApiOkResponse({ type: BannerResponseDto })
  create(
    @Body() body: UpsertBannerDto,
    @UploadedFiles() files?: BannerUploadFields,
  ) {
    return this.bannersService.create(body, files);
  }

  @Put(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'imageVi', maxCount: 1 },
    { name: 'imageEn', maxCount: 1 },
    { name: 'imageKo', maxCount: 1 },
  ]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cập nhật banner' })
  @ApiBody({ type: UpsertBannerDto })
  @ApiOkResponse({ type: BannerResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpsertBannerDto,
    @UploadedFiles() files?: BannerUploadFields,
  ) {
    return this.bannersService.update(id, body, files);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa banner' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.remove(id);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Cập nhật thứ tự hiển thị banner' })
  reorder(@Body() body: ReorderBannersDto) {
    return this.bannersService.reorder(body);
  }
}
