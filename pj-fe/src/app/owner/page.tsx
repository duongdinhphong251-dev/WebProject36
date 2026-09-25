import Link from 'next/link';
import { redirect } from 'next/navigation';
import { api, type City, type Deal, type Spa, type User } from '@/lib/api';
import { OwnerForm } from '@/components/OwnerForm';
import { MutationButton } from '@/components/MutationButton';

type Stats = { spas: number; vouchers: number; bookings: number };
type Booking = {
  id: string;
  spaName: string;
  userName: string;
  userPhone: string;
  scheduledAt: string;
  status: string;
  dealTitle?: string | null;
};
export default async function Page() {
  const user = await api<User>('auth/me');
  if (user.role !== 'spa_owner')
    redirect(user.role === 'admin' ? '/admin' : '/me');
  const [spas, deals, bookings, stats, cities] = await Promise.all([
    api<Spa[]>('owner/spas'),
    api<Deal[]>('owner/deals'),
    api<Booking[]>('owner/bookings'),
    api<Stats>('owner/stats'),
    api<City[]>('catalog/cities'),
  ]);
  return (
    <main className="container stack">
      <p>
        <Link href="/vi">← Trang chủ</Link>
      </p>
      <h1>Quản lý spa</h1>
      <p>
        {user.fullName} · {stats.spas} spa · {stats.vouchers} voucher ·{' '}
        {stats.bookings} lịch đặt
      </p>
      <h2>Thêm spa</h2>
      <OwnerForm kind="spa" cities={cities} />
      <h2>Spa của tôi</h2>
      {spas.map((spa) => (
        <details className="card" key={spa.id}>
          <summary>
            {spa.name} · <span className="pill">{spa.approvalStatus}</span>
          </summary>
          <OwnerForm kind="spa" item={spa} cities={cities} />
        </details>
      ))}
      <h2>Thêm voucher</h2>
      <OwnerForm kind="deal" spas={spas} />
      <h2>Voucher của tôi</h2>
      {deals.map((deal) => (
        <details className="card" key={deal.id}>
          <summary>
            {deal.titleVi} · <span className="pill">{deal.approvalStatus}</span>
          </summary>
          <OwnerForm kind="deal" item={deal} />
          <MutationButton path={`owner/deals/${deal.id}`} method="DELETE">
            Xóa voucher
          </MutationButton>
        </details>
      ))}
      <h2>Lịch đặt</h2>
      {bookings.map((item) => (
        <div className="card" key={item.id}>
          {item.spaName} · {item.userName} · {item.userPhone} ·{' '}
          {new Date(item.scheduledAt).toLocaleString('vi-VN')}{' '}
          {item.dealTitle && <>· Voucher: {item.dealTitle}</>} · {item.status}
        </div>
      ))}
    </main>
  );
}
