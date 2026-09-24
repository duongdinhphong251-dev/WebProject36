import Link from 'next/link';
import { api, type Deal, type Spa, type User } from '@/lib/api';
import { SpaActions } from '@/components/SpaActions';

export default async function SpaPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const [spa, deals, user] = await Promise.all([api<Spa>(`catalog/spas/${id}`), api<Deal[]>('catalog/deals'), api<User>('auth/me')]);
  return <div className="stack"><Link href={`/${locale}`}>← {locale === 'en' ? 'Back' : 'Quay lại'}</Link><h1>{spa.name}</h1><p>{spa.description}</p><p>{spa.address}</p><div className="row">{spa.phone && <a className="button" href={`tel:${spa.phone}`}>{locale === 'en' ? 'Call' : 'Gọi'} {spa.phone}</a>}{spa.zalo && <a className="button secondary" href={spa.zalo}>Zalo</a>}</div>
    <h2>{locale === 'en' ? 'Vouchers' : 'Voucher'}</h2><div className="grid">{deals.filter(deal => deal.spaId === id).map(deal => <Link className="card" key={deal.id} href={`/${locale}/deals/${deal.id}`}>{locale === 'en' ? deal.titleEn || deal.titleVi : deal.titleVi}</Link>)}</div>
    <h2>{locale === 'en' ? 'Reviews' : 'Đánh giá'}</h2>{spa.reviews?.map((review, index) => <div className="card" key={index}><strong>{review.author} · {review.rating}/5</strong><p>{review.comment}</p></div>)}
    <SpaActions spaId={id} role={user.role} locale={locale} />
  </div>;
}
