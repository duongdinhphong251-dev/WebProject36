import { Module } from '@nestjs/common';
import { SeoTemplateService } from './seo-template.service';
import { SeoUrlsController } from './seo-urls.controller';
import { SeoUrlsService } from './seo-urls.service';

@Module({
  controllers: [SeoUrlsController],
  providers: [SeoTemplateService, SeoUrlsService],
  exports: [SeoTemplateService, SeoUrlsService],
})
export class SeoModule {}
