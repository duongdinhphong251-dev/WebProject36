'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { City, User } from '@/lib/api';

export function Header({ locale, cities, user }: { locale: string; cities: City[]; user: User }) {
  const english = locale === 'en';
  const router = useRouter();
  const path = usePathname();
  const search = useSearchParams();
  const city = search.get('city') || '';
  function changeCity(value: string) {
    const params = new URLSearchParams(search.toString());
    if (value) params.set('city', value); else params.delete('city');
    router.push(`/${locale}${params.size ? `?${params.toString()}` : ''}`);
  }
  function switchLanguage(value: string) { router.push(path.replace(/^\/(vi|en)(?=\/|$)/, `/${value}`) + (search.size ? `?${search}` : '')); }
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/login'); router.refresh(); }
  const filters = <><label>{english ? 'City' : 'Thành phố'} <select className="input" value={city} onChange={e => changeCity(e.target.value)}><option value="">{english ? 'All cities' : 'Tất cả'}</option>{cities.map(c => <option key={c.id} value={c.slug || ''}>{english ? c.nameEn || c.nameVi : c.nameVi}</option>)}</select></label><label>{english ? 'Language' : 'Ngôn ngữ'} <select className="input" value={locale} onChange={e => switchLanguage(e.target.value)}><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label></>;
  const nav = <nav className="nav"><Link href={`/${locale}`}>{english ? 'Home' : 'Trang chủ'}</Link>{user.role === 'user' && <Link href="/me">{english ? 'My account' : 'Cá nhân'}</Link>}{user.role === 'spa_owner' && <Link href="/owner">{english ? 'Manage spas' : 'Quản lý spa'}</Link>}{user.role === 'admin' && <Link href="/admin">{english ? 'Admin' : 'Quản trị'}</Link>}<button className="button secondary" onClick={logout}>{english ? 'Log out' : 'Đăng xuất'}</button></nav>;
  return <header className="header"><div className="container header-inner"><strong><Link href={`/${locale}`}>Nhom36 Spa</Link></strong><div className="desktop-filter row">{filters}</div>{nav}<details className="mobile-menu"><summary>☰ Menu</summary><div className="stack">{filters}{nav}</div></details></div></header>;
}
