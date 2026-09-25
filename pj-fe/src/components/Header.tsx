'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { City, User } from '@/lib/api';
import { LogoutButton } from './LogoutButton';

export function Header({
  locale,
  cities,
  user,
}: {
  locale: string;
  cities: City[];
  user: User;
}) {
  const english = locale === 'en';
  const router = useRouter();
  const path = usePathname();
  const search = useSearchParams();
  const city = search.get('city') || '';
  function changeCity(value: string) {
    const params = new URLSearchParams(search.toString());
    if (value) params.set('city', value);
    else params.delete('city');
    router.push(`/${locale}${params.size ? `?${params.toString()}` : ''}`);
  }
  function switchLanguage(value: string) {
    router.push(
      path.replace(/^\/(vi|en)(?=\/|$)/, `/${value}`) +
        (search.size ? `?${search}` : ''),
    );
  }
  const filters = (
    <>
      <label className="header-select">
        <span className="sr-only">{english ? 'City' : 'Thành phố'}</span>
        <select value={city} onChange={(e) => changeCity(e.target.value)}>
          <option value="">
            {english ? 'All cities' : 'Tất cả thành phố'}
          </option>
          {cities.map((c) => (
            <option key={c.id} value={c.slug || ''}>
              {english ? c.nameEn || c.nameVi : c.nameVi}
            </option>
          ))}
        </select>
      </label>
      <label className="header-select">
        <span className="sr-only">{english ? 'Language' : 'Ngôn ngữ'}</span>
        <select value={locale} onChange={(e) => switchLanguage(e.target.value)}>
          <option value="vi">VI</option>
          <option value="en">EN</option>
        </select>
      </label>
    </>
  );
  const nav = (
    <nav className="nav">
      <Link href={`/${locale}`}>{english ? 'Home' : 'Trang chủ'}</Link>
      {user.role === 'user' && (
        <Link href="/me">{english ? 'My account' : 'Cá nhân'}</Link>
      )}
      {user.role === 'spa_owner' && (
        <Link href="/owner">{english ? 'Manage spas' : 'Quản lý spa'}</Link>
      )}
      {user.role === 'admin' && (
        <Link href="/admin">{english ? 'Admin' : 'Quản trị'}</Link>
      )}
      <LogoutButton className="header-logout">
        {english ? 'Log out' : 'Đăng xuất'}
      </LogoutButton>
    </nav>
  );
  return (
    <header className="header">
      <div className="container header-inner">
        <strong className="brand">
          <Link href={`/${locale}`}>
            <Image
              className="brand-logo"
              src="/assets/images/common/logo_x.png"
              alt="Logo nhóm 36"
              width={46}
              height={46}
              priority
            />
            <span>Nhom36</span>
          </Link>
        </strong>
        <form className="header-search" action={`/${locale}`}>
          <span aria-hidden="true">⌕</span>
          <input
            name="q"
            defaultValue={search.get('q') || ''}
            placeholder={
              english ? 'Search spas and vouchers...' : 'Tìm spa, voucher...'
            }
            aria-label={english ? 'Search' : 'Tìm kiếm'}
          />
          {city && <input type="hidden" name="city" value={city} />}
        </form>
        <div className="desktop-filter row">{filters}</div>
        {nav}
        <details className="mobile-menu">
          <summary>☰</summary>
          <div className="mobile-menu-content">
            <form className="header-search" action={`/${locale}`}>
              <input
                name="q"
                defaultValue={search.get('q') || ''}
                placeholder={
                  english
                    ? 'Search spas and vouchers...'
                    : 'Tìm spa, voucher...'
                }
                aria-label={english ? 'Search' : 'Tìm kiếm'}
              />
              {city && <input type="hidden" name="city" value={city} />}
            </form>
            {filters}
            {nav}
          </div>
        </details>
      </div>
    </header>
  );
}
