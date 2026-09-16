import { notFound } from 'next/navigation';
import { locales } from '@/i18n/settings';
import { routing } from '@/libs/I18nRouting';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

import { LanguageSync } from '@/components/common/locale-switcher/LanguageSync';

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  return (
    <LanguageSync>
      {props.children}
    </LanguageSync>
  );
}
