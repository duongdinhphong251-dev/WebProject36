import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { DealsModule } from '../deals/deals.module';
import { LocationsModule } from '../locations/locations.module';
import { ServicesModule } from '../services/services.module';
import { UrlResolverModule } from '../url-resolver/url-resolver.module';
import { SeoModule } from '../seo/seo.module';

@Module({
  imports: [DealsModule, LocationsModule, ServicesModule, UrlResolverModule, SeoModule],
  controllers: [PagesController],
  providers: [PagesService],
})
export class PagesModule {}
