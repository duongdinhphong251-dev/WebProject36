import Link from 'next/link';
import { api, type Deal, type Spa } from '@/lib/api';

export default async function Home({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ city?: string }> }) {
  const { locale } = await params;
  const { city } = await searchParams;
  const query = city ? `?city=${encodeURIComponent(city)}` : '';
  const [spas, deals] = await Promise.all([api<Spa[]>(`catalog/spas${query}`), api<Deal[]>(`catalog/deals${query}`)]);
  return <>
    <h1>{locale === 'en' ? 'Find your spa' : 'Tìm spa phù hợp'}</h1>
    <p className="muted">{locale === 'en' ? 'Explore spas and vouchers by city.' : 'Xem spa và voucher theo thành phố.'}</p>
    <h2>{locale === 'en' ? 'Spas' : 'Spa'}</h2>
    <div className="grid">{spas.map(spa => <Link className="card stack" key={spa.id} href={`/${locale}/spas/${spa.id}`}><strong>{spa.name}</strong><span className="muted">{spa.address}</span><span className="pill">{locale === 'en' ? 'View details' : 'Xem chi tiết'}</span></Link>)}</div>
    {!spas.length && <p>{locale === 'en' ? 'No spas in this city yet.' : 'Chưa có spa ở thành phố này.'}</p>}
    <h2>{locale === 'en' ? 'Vouchers' : 'Voucher'}</h2>
    <div className="grid">{deals.map(deal => <Link className="card stack" key={deal.id} href={`/${locale}/deals/${deal.id}`}><strong>{locale === 'en' ? deal.titleEn || deal.titleVi : deal.titleVi}</strong><span>{deal.spaName}</span><span className="pill">{deal.priceVnd ? `${deal.priceVnd.toLocaleString('vi-VN')} ₫` : deal.discountPercent ? `${locale === 'en' ? 'Save' : 'Giảm'} ${deal.discountPercent}%` : locale === 'en' ? 'View offer' : 'Xem ưu đãi'}</span></Link>)}</div>
    {!deals.length && <p>{locale === 'en' ? 'No vouchers in this city yet.' : 'Chưa có voucher ở thành phố này.'}</p>}
  </>;
}
