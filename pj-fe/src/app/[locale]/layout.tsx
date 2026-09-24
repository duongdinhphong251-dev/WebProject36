import { notFound, redirect } from 'next/navigation';
import { api, type City, type User } from '@/lib/api';
import { Header } from '@/components/Header';

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!['vi', 'en'].includes(locale)) notFound();
  const [user, cities] = await Promise.all([api<User>('auth/me'), api<City[]>('catalog/cities')]);
  if (user.role === 'admin') redirect('/admin');
  return <><Header locale={locale} user={user} cities={cities} /><main className="container">{children}</main></>;
}
