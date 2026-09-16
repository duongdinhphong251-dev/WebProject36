'use client';

import type { i18n } from 'i18next';
import type { LocaleTypes } from './settings';
import i18next from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { useEffect } from 'react';
import { initReactI18next, useTranslation as useTransAlias } from 'react-i18next';

import { getOptions, locales, fallbackLng } from './settings';

const runsOnServerSide = typeof window === 'undefined';

const detectLanguageFromPath = (): LocaleTypes => {
  try {
    if (typeof window === 'undefined') {
      return fallbackLng;
    }

    const path = window.location.pathname;
    const lang = path.split('/')[1];
    const supportedLanguages: LocaleTypes[] = locales as unknown as LocaleTypes[];
    return supportedLanguages.includes(lang as LocaleTypes) ? (lang as LocaleTypes) : fallbackLng;
  } catch {
    return fallbackLng;
  }
};

// Initialize i18next for the client side
i18next
  // .use(LanguageDetector)
  .use(initReactI18next)
  .use(
    resourcesToBackend((language: LocaleTypes, namespace: string) => import(`./locales/${language}/${namespace}.json`)),
  )
  .init({
    ...getOptions(),
    lng: detectLanguageFromPath(),
    detection: {
      order: ['path'],
    },
    preload: locales,
    initImmediate: !runsOnServerSide,
    returnObjects: true,
  });

export function useTranslation(lng: LocaleTypes, ns: string | string[]) {
  if (runsOnServerSide && lng && i18next.resolvedLanguage !== lng) {
    i18next.changeLanguage(lng);
  }
  const translator = useTransAlias(ns);
  const { i18n } = translator;
  
  if (!runsOnServerSide) {
    // Use our custom implementation when running on client side
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useCustomTranslationImplem(i18n, lng);
  }
  return translator;
}

function useCustomTranslationImplem(i18n: i18n, lng: LocaleTypes) {
  // This effect changes the language of the application when the lng prop changes.
  useEffect(() => {
    if (!lng) {
      return;
    }
    const changeLanguage = async () => {
      await i18n.loadLanguages(lng);
      if (i18n.resolvedLanguage !== lng) {
        i18n.changeLanguage(lng);
      }
    };

    changeLanguage();
  }, [lng, i18n]);
}
