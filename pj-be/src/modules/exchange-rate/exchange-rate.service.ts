import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

export interface ExchangeRateData {
  usdToVnd: number;
  vndToKrw: number;
  updatedAt: string;
}

@Injectable()
export class ExchangeRateService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeRateService.name);

  // Synchronous initialization prevents startup race conditions
  private cachedData: ExchangeRateData = {
    usdToVnd: 25400,
    vndToKrw: 0.05433,
    updatedAt: new Date().toISOString(),
  };

  async onModuleInit() {
    this.logger.log('Initializing ExchangeRateService - triggering initial rate fetch...');
    await this.fetchExchangeRate();
  }

  @Cron('0 */6 * * *')
  async handleCron() {
    this.logger.log('Scheduled cron job: refreshing exchange rates...');
    await this.fetchExchangeRate();
  }

  async fetchExchangeRate(): Promise<ExchangeRateData> {
    const url = process.env.EXCHANGE_RATE_API_URL ?? 'https://open.er-api.com/v6/latest/USD';
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as {
        result?: string;
        rates?: Record<string, number>;
      };

      if (data?.result === 'success' && data?.rates?.VND && data?.rates?.KRW) {
        const usdToVnd = Math.round(data.rates.VND);
        const usdToKrw = data.rates.KRW;
        const vndToKrw = Number((usdToKrw / data.rates.VND).toFixed(5));
        const updatedAt = new Date().toISOString();

        this.cachedData = {
          usdToVnd,
          vndToKrw,
          updatedAt,
        };

        this.logger.log(
          `Exchange rate successfully updated from ${url}: usdToVnd=${usdToVnd}, vndToKrw=${vndToKrw}`,
        );
      } else {
        throw new Error('Invalid or missing rate fields in external API response');
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch exchange rate from ${url}: ${error instanceof Error ? error.message : String(error)}. Retaining previous cache.`,
      );
    }

    return this.getExchangeRate();
  }

  getExchangeRate(): ExchangeRateData {
    return { ...this.cachedData };
  }
}
