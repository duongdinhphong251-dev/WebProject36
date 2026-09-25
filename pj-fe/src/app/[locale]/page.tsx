import Image from 'next/image';
import Link from 'next/link';
import { api, type Deal, type Spa } from '@/lib/api';
import { DealCard, SpaCard } from '@/components/CatalogCards';

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ city?: string; q?: string }>;
}) {
  const { locale } = await params;
  const { city, q } = await searchParams;
  const query = city ? `?city=${encodeURIComponent(city)}` : '';
  const [spas, deals] = await Promise.all([
    api<Spa[]>(`catalog/spas${query}`),
    api<Deal[]>(`catalog/deals${query}`),
  ]);
  const english = locale === 'en';
  const term = q?.trim().toLocaleLowerCase() || '';
  const visibleSpas = term
    ? spas.filter((spa) =>
        `${spa.name} ${spa.address} ${spa.city}`
          .toLocaleLowerCase()
          .includes(term),
      )
    : spas;
  const visibleDeals = term
    ? deals.filter((deal) =>
        `${deal.titleVi} ${deal.titleEn} ${deal.spaName}`
          .toLocaleLowerCase()
          .includes(term),
      )
    : deals;
  return (
    <>
      <section className="home-intro">
        <h1>
          {english ? 'Discover your next spa' : 'Khám phá spa phù hợp với bạn'}
        </h1>
        <p>
          {english
            ? 'Find places to relax and great local offers.'
            : 'Tìm nơi thư giãn và ưu đãi spa ngay tại thành phố của bạn.'}
        </p>
      </section>
      <section className="category-section" aria-labelledby="category-title">
        <h2 id="category-title">
          {english ? 'What do you need today?' : 'Bạn cần gì hôm nay?'}
        </h2>
        <div className="category-grid">
          <Link href="#spas" className="category-tile">
            <Image
              src="/assets/category/massage-spa.png"
              alt=""
              width={80}
              height={80}
            />
            <span>Massage & Spa</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="#deals" className="category-tile">
            <Image
              src="/assets/category/lam-dep.png"
              alt=""
              width={80}
              height={80}
            />
            <span>{english ? 'Spa vouchers' : 'Voucher làm đẹp'}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
      <section className="catalog-section" id="spas">
        <div className="section-heading">
          <div>
            <span className="eyebrow">NHOM36 SPA</span>
            <h2>{english ? 'Recommended spas' : 'Spa dành cho bạn'}</h2>
          </div>
          <span className="section-count">
            {visibleSpas.length} {english ? 'places' : 'địa điểm'}
          </span>
        </div>
        <div className="catalog-grid">
          {visibleSpas.map((spa) => (
            <SpaCard key={spa.id} spa={spa} locale={locale} />
          ))}
        </div>
        {!visibleSpas.length && (
          <p className="empty-state">
            {english ? 'No matching spas.' : 'Không tìm thấy spa phù hợp.'}
          </p>
        )}
      </section>
      <section className="catalog-section" id="deals">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{english ? 'OFFERS' : 'ƯU ĐÃI'}</span>
            <h2>{english ? 'Spa vouchers' : 'Voucher nổi bật'}</h2>
          </div>
          <span className="section-count">{visibleDeals.length} voucher</span>
        </div>
        <div className="catalog-grid">
          {visibleDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} locale={locale} />
          ))}
        </div>
        {!visibleDeals.length && (
          <p className="empty-state">
            {english
              ? 'No matching vouchers.'
              : 'Không tìm thấy voucher phù hợp.'}
          </p>
        )}
      </section>
    </>
  );
}
