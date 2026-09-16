import type { InitOptions } from 'i18next';

export const fallbackLng = 'vi';
export const EN = 'en';
export const KO = 'ko';
export const VI = 'vi';
export const locales = [fallbackLng, EN, KO] as const;
export type LocaleTypes = (typeof locales)[number];
export const defaultNS = 'common';

export const LANGUAGE_COOKIE = 'preferred_language';

export function getOptions(lang = fallbackLng, ns = defaultNS): InitOptions {
  return {
    debug: false, // Set to true to see console logs
    supportedLngs: locales,
    fallbackLng,
    lng: lang,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
    showSupportNotice: false,
  };
}
