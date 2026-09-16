import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateResponseDto } from './dto/exchange-rate-response.dto';

@ApiTags('config')
@Controller('config')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Get('exchange-rate')
  @ApiOperation({
    summary: 'Lấy tỷ giá quy đổi động (USD-VND, VND-KRW)',
    description: 'Endpoint public trả về tỷ giá USD/VND và VND/KRW trực tiếp được lưu cache.',
  })
  @ApiOkResponse({ type: ExchangeRateResponseDto })
  getExchangeRate() {
    return this.exchangeRateService.getExchangeRate();
  }
}
