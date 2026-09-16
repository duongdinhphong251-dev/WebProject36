import type { LocaleTypes } from '@/i18n/settings';
import type { MenuItem } from '@/types/menu';
import LayoutMain from '@/components/layouts/main';
import { getTranslation } from '@/i18n/server-cache';

export default async function MainLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const { t } = await getTranslation(locale as LocaleTypes, 'main-menu');

  const menuData = t('main-menu', { returnObjects: true });
  const menu: MenuItem[] = Array.isArray(menuData) ? menuData : [];

  return (
    <LayoutMain locale={locale} menu={menu}>
      {props.children}
    </LayoutMain>
  );
}
