import Link from 'next/link';
import Image from 'next/image';
import { api, type ClaimedVoucher, type Deal, type User } from '@/lib/api';
import { SpaActions } from '@/components/SpaActions';
import { MutationButton } from '@/components/MutationButton';

export default async function DealPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [deal, user] = await Promise.all([
    api<Deal>(`catalog/deals/${id}`, { detail: true }),
    api<User>('auth/me'),
  ]);
  const vouchers =
    user.role === 'user' ? await api<ClaimedVoucher[]>('me/vouchers') : [];
  const claimed = vouchers.find((voucher) => voucher.dealId === deal.id);
  const discount = Number.parseFloat(deal.discountPercent || '');
  return (
    <div className="detail-shell stack">
      <Link className="detail-back" href={`/${locale}#deals`}>
        ← {locale === 'en' ? 'Back to vouchers' : 'Trở về danh sách voucher'}
      </Link>
      <div className="detail-hero">
        <div className="detail-image">
          <Image
            src={deal.image || '/assets/category/lam-dep.png'}
            alt={deal.titleVi || 'Voucher'}
            fill
            unoptimized
            sizes="(max-width: 700px) 100vw, 50vw"
          />
        </div>
        <div className="detail-info">
          <span className="eyebrow">VOUCHER NHOM36</span>
          <h1>
            {locale === 'en' ? deal.titleEn || deal.titleVi : deal.titleVi}
          </h1>
          <p>{deal.description}</p>
          <p>
            {locale === 'en' ? 'Spa' : 'Tại spa'}:{' '}
            <Link
              className="detail-back"
              href={`/${locale}/spas/${deal.spaId}`}
            >
              {deal.spaName}
            </Link>
          </p>
          <p className="deal-price">
            {deal.priceVnd != null
              ? `${deal.priceVnd.toLocaleString('vi-VN')} ₫`
              : Number.isFinite(discount)
                ? `${locale === 'en' ? 'Save' : 'Giảm'} ${discount}%`
                : ''}
          </p>
          {user.role === 'user' && (
            <div className="detail-contact">
              {claimed ? (
                <span className="pill">
                  {claimed.status === 'used'
                    ? locale === 'en'
                      ? 'Used'
                      : 'Đã dùng'
                    : locale === 'en'
                      ? 'Claimed — book below'
                      : 'Đã nhận — đặt lịch bên dưới'}
                </span>
              ) : (
                <MutationButton path={`me/vouchers/${deal.id}`} method="POST">
                  {locale === 'en' ? 'Claim voucher' : 'Nhận voucher'}
                </MutationButton>
              )}
            </div>
          )}
        </div>
      </div>
      <SpaActions
        spaId={deal.spaId}
        role={user.role}
        dealId={deal.id}
        voucherStatus={claimed?.status}
        locale={locale}
      />
    </div>
  );
}
