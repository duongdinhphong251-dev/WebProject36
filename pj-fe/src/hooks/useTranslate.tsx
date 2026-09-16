'use client';

import type { LocaleTypes } from '../i18n/settings';
import { useParams } from 'next/navigation';
import { useTranslation } from '../i18n/client';

export default function useTranslate(ns: string | string[]) {
  const locale = useParams()?.locale as LocaleTypes;
  const { t: translate } = useTranslation(locale, ns);
  return translate;
}
