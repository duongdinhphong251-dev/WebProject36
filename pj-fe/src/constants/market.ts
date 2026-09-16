export interface MarketConfig {
  countryCode: string;
  currency: string;
  timezone: string;
  vatRate: number;
  defaultLanguage: string;
  supportedLanguages: string[];
}

export const MARKETS = {
  vn: {
    countryCode: 'VN',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    vatRate: 0.08,
    defaultLanguage: 'vi',
    supportedLanguages: ['vi', 'en', 'ko'],
  },
  ph: {
    countryCode: 'PH',
    currency: 'PHP',
    timezone: 'Asia/Manila',
    vatRate: 0.12,
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'tl'],
  },
  th: {
    countryCode: 'TH',
    currency: 'THB',
    timezone: 'Asia/Bangkok',
    vatRate: 0.07,
    defaultLanguage: 'th',
    supportedLanguages: ['th', 'en'],
  },
} as const satisfies Record<string, MarketConfig>;

export type MarketCode = keyof typeof MARKETS;

export function getMarketConfig(code: string | undefined | null): MarketConfig {
  if (code && code in MARKETS) {
    return MARKETS[code as MarketCode];
  }
  return MARKETS.vn;
}
