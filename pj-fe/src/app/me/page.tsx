import { redirect } from 'next/navigation';
import Link from 'next/link';
import { api, type ClaimedVoucher, type Spa, type User } from '@/lib/api';
import { MutationButton } from '@/components/MutationButton';

type Booking = {
  id: string;
  spaName: string;
  dealTitle?: string | null;
  status: string;
  scheduledAt: string;
};
type Review = { id: string; spaName: string; rating: number; comment: string };
export default async function Page() {
  const user = await api<User>('auth/me');
  if (user.role !== 'user')
    redirect(user.role === 'admin' ? '/admin' : '/owner');
  const [saved, bookings, reviews, vouchers] = await Promise.all([
    api<Spa[]>('me/saved'),
    api<Booking[]>('me/bookings'),
    api<Review[]>('me/reviews'),
    api<ClaimedVoucher[]>('me/vouchers'),
  ]);
  return (
    <main className="container stack">
      <p>
        <Link href="/vi">← Trang chủ</Link>
      </p>
      <h1>Xin chào, {user.fullName}</h1>
      <h2>Spa đã lưu</h2>
      <div className="grid">
        {saved.map((spa) => (
          <div className="card stack" key={spa.id}>
            <Link href={`/vi/spas/${spa.id}`}>{spa.name}</Link>
            <MutationButton path={`me/saved/${spa.id}`} method="DELETE">
              Bỏ lưu
            </MutationButton>
          </div>
        ))}
      </div>
      {!saved.length && <p>Chưa lưu spa nào.</p>}
      <h2>Voucher của tôi</h2>
      {vouchers.map((item) => {
        const expired =
          item.status === 'available' &&
          (item.approvalStatus !== 'approved' ||
            item.spaApprovalStatus !== 'approved' ||
            (!!item.endAt && new Date(item.endAt) <= new Date()));
        return (
          <div className="card row" key={item.dealId}>
            <strong>{item.titleVi}</strong>
            <span className="muted">{item.spaName}</span>
            <span className="pill">
              {item.status === 'used'
                ? 'Đã dùng'
                : expired
                  ? 'Hết hiệu lực'
                  : 'Có thể dùng'}
            </span>
            {item.status === 'available' && !expired && (
              <Link
                className="button secondary"
                href={`/vi/deals/${item.dealId}`}
              >
                Đặt lịch với voucher
              </Link>
            )}
          </div>
        );
      })}
      {!vouchers.length && <p>Chưa nhận voucher nào.</p>}
      <h2>Lịch đã đặt</h2>
      {bookings.map((item) => (
        <div className="card" key={item.id}>
          {item.spaName} · {new Date(item.scheduledAt).toLocaleString('vi-VN')}{' '}
          {item.dealTitle && <>· Voucher: {item.dealTitle}</>} ·{' '}
          <span className="pill">{item.status}</span>
        </div>
      ))}
      {!bookings.length && <p>Chưa có lịch đặt.</p>}
      <h2>Đánh giá của tôi</h2>
      {reviews.map((item) => (
        <div className="card" key={item.id}>
          {item.spaName} · {item.rating}/5 · {item.comment}
        </div>
      ))}
      {!reviews.length && <p>Chưa có đánh giá.</p>}
    </main>
  );
}
