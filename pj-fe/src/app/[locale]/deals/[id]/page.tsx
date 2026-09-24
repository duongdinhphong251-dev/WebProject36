import Link from 'next/link';
import { api, type Deal, type User } from '@/lib/api';
import { SpaActions } from '@/components/SpaActions';

export default async function DealPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const [deal, user] = await Promise.all([api<Deal>(`catalog/deals/${id}`), api<User>('auth/me')]);
  return <div className="stack"><Link href={`/${locale}`}>← {locale === 'en' ? 'Back' : 'Quay lại'}</Link><h1>{locale === 'en' ? deal.titleEn || deal.titleVi : deal.titleVi}</h1><p>{deal.description}</p><p>Spa: <Link href={`/${locale}/spas/${deal.spaId}`}>{deal.spaName}</Link></p><p><strong>{deal.priceVnd ? `${deal.priceVnd.toLocaleString('vi-VN')} ₫` : deal.discountPercent ? `${locale === 'en' ? 'Save' : 'Giảm'} ${deal.discountPercent}%` : ''}</strong></p><SpaActions spaId={deal.spaId} role={user.role} dealId={deal.id} locale={locale} /></div>;
}
