import { locales } from '@/i18n/settings';

const localePrefix = 'as-needed';

export const AppConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME,
  locales,
  defaultLocale: 'vi',
  localePrefix,
};
