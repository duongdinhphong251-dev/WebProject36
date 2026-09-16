import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { ServiceSuggestResponseDto } from './dto/search-suggest.dto';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }
    @Get('suggest')
    async suggest(
        @Query('keyword') keyword?: string,
        @Query('lang') lang?: string
    ): Promise<ServiceSuggestResponseDto> {
        if (!keyword || keyword.trim().length === 0) {
            return {
                service: [],
                spa: [],
                deal: [],
                location: []
            };
        }
        return this.searchService.suggest(keyword, lang);
    }

}