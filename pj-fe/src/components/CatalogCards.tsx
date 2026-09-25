import Image from 'next/image';
import Link from 'next/link';
import type { Deal, Spa } from '@/lib/api';

export function SpaCard({ spa, locale }: { spa: Spa; locale: string }) {
  return (
    <Link className="catalog-card spa-card" href={`/${locale}/spas/${spa.id}`}>
      <div className="catalog-image">
        <Image
          src={spa.image || '/assets/category/massage-spa.png'}
          alt={spa.name || 'Spa'}
          fill
          unoptimized
          sizes="(max-width: 700px) 50vw, 25vw"
        />
      </div>
      <div className="catalog-copy">
        <strong>{spa.name}</strong>
        <span className="catalog-location">
          ⌖{' '}
          {spa.address ||
            spa.city ||
            (locale === 'en' ? 'Spa' : 'Spa & massage')}
        </span>
      </div>
    </Link>
  );
}

export function DealCard({ deal, locale }: { deal: Deal; locale: string }) {
  const discount =
    Number(deal.discountPercent) ||
    Number(deal.titleVi?.match(/(?:giảm|save)\s*(\d+)%/i)?.[1] || 0);
  return (
    <Link
      className="catalog-card deal-card"
      href={`/${locale}/deals/${deal.id}`}
    >
      <div className="catalog-image">
        <Image
          src={deal.image || '/assets/category/lam-dep.png'}
          alt={deal.titleVi || 'Voucher'}
          fill
          unoptimized
          sizes="(max-width: 700px) 50vw, 25vw"
        />
        {discount > 0 && <span className="discount-badge">-{discount}%</span>}
      </div>
      <div className="catalog-copy">
        <strong>
          {locale === 'en' ? deal.titleEn || deal.titleVi : deal.titleVi}
        </strong>
        <span className="catalog-location">
          ⌖ {deal.spaName || 'Nhom36 Spa'}
        </span>
        {deal.priceVnd != null && (
          <span className="deal-price">
            {deal.priceVnd.toLocaleString('vi-VN')} ₫
          </span>
        )}
      </div>
    </Link>
  );
}
