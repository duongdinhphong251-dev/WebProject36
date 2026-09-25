import Link from 'next/link';
import Image from 'next/image';
import { api, type Deal, type Spa, type User } from '@/lib/api';
import { SpaActions } from '@/components/SpaActions';
import { DealCard } from '@/components/CatalogCards';

export default async function SpaPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [spa, deals, user] = await Promise.all([
    api<Spa>(`catalog/spas/${id}`, { detail: true }),
    api<Deal[]>(`catalog/deals?spaId=${encodeURIComponent(id)}`),
    api<User>('auth/me'),
  ]);
  return (
    <div className="detail-shell stack">
      <Link className="detail-back" href={`/${locale}`}>
        ← {locale === 'en' ? 'Back to spas' : 'Trở về danh sách spa'}
      </Link>
      <div className="detail-hero">
        <div className="detail-image">
          <Image
            src={spa.image || '/assets/category/massage-spa.png'}
            alt={spa.name || 'Spa'}
            fill
            unoptimized
            sizes="(max-width: 700px) 100vw, 50vw"
          />
        </div>
        <div className="detail-info">
          <span className="eyebrow">NHOM36 SPA</span>
          <h1>{spa.name}</h1>
          <p className="muted">⌖ {spa.address}</p>
          <p>{spa.description}</p>
          <div className="row detail-contact">
            {spa.phone && (
              <a className="button" href={`tel:${spa.phone}`}>
                {locale === 'en' ? 'Call' : 'Gọi'} {spa.phone}
              </a>
            )}
            {spa.zalo && (
              <a className="button secondary" href={spa.zalo}>
                Zalo
              </a>
            )}
          </div>
        </div>
      </div>
      <section className="detail-section">
        <h2>{locale === 'en' ? 'Vouchers' : 'Voucher của spa'}</h2>
        <div className="catalog-grid">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} locale={locale} />
          ))}
        </div>
      </section>
      <section className="detail-section">
        <h2>{locale === 'en' ? 'Reviews' : 'Đánh giá'}</h2>
        {spa.reviews?.map((review, index) => (
          <div className="card" key={index}>
            <strong>
              {review.author} · {review.rating}/5
            </strong>
            <p>{review.comment}</p>
          </div>
        ))}
      </section>
      <SpaActions spaId={id} role={user.role} locale={locale} />
    </div>
  );
}
