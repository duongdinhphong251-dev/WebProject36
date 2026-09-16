import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PagesService } from './pages.service';
import { PageResolveQueryDto } from './dto/page-resolve-query.dto';
import { PagePayloadDto } from './dto/page-payload.dto';

@ApiTags('pages')
@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get('resolve')
  @ApiOperation({
    summary: 'Page Resolver — 1 API cho mọi public page',
    description:
      'FE truyền URL hiện tại, backend trả full payload: ' +
      'SEO meta, breadcrumbs, danh sách deals (grouped by spa), flash sale, và tất cả filter options. ' +
      'URL pattern: /[service_slug], /[service_slug]/[city_slug], /[service_slug]/[city_slug]/[district_slug]',
  })
  @ApiOkResponse({ type: PagePayloadDto })
  resolvePage(@Query() query: PageResolveQueryDto): Promise<PagePayloadDto> {
    return this.pagesService.resolvePage(query);
  }
}
