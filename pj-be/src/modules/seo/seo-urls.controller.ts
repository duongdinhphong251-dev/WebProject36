import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeoUrlsService } from './seo-urls.service';
import { SeoUrlsQueryDto } from './dto/seo-urls-query.dto';
import { SeoUrlItemDto } from './dto/seo-url-item.dto';

@ApiTags('seo')
@Controller('seo')
export class SeoUrlsController {
  constructor(private readonly seoUrlsService: SeoUrlsService) {}

  @Get('urls')
  @ApiOperation({
    summary: 'Danh sách URL category/geo từ seo_nodes (sitemap, hreflang)',
    description:
      'Trả path segment `url` + `locale` + entity ids. FE ghép full URL: ' +
      'vi → `/{url}`, en/ko → `/{locale}/{url}`. ' +
      'Phase sitemap tỉnh: `nodeType=category,city` + `locale=vi,en,ko`.',
  })
  @ApiOkResponse({ type: SeoUrlItemDto, isArray: true })
  listUrls(@Query() query: SeoUrlsQueryDto) {
    return this.seoUrlsService.listUrls(query);
  }

  @Get('urls/count')
  @ApiOperation({
    summary: 'Đếm số URL khớp filter (cùng query params như GET /seo/urls)',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { total: { type: 'number', example: 1920 } },
    },
  })
  countUrls(@Query() query: SeoUrlsQueryDto) {
    return this.seoUrlsService.countUrls(query);
  }
}
