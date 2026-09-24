import { redirect } from 'next/navigation';
import Link from 'next/link';
import { api, type Spa, type User } from '@/lib/api';
import { MutationButton } from '@/components/MutationButton';

type Booking = { id: string; spaName: string; status: string; scheduledAt: string };
type Review = { id: string; spaName: string; rating: number; comment: string };
export default async function Page() {
  const user = await api<User>('auth/me');
  if (user.role !== 'user') redirect(user.role === 'admin' ? '/admin' : '/owner');
  const [saved, bookings, reviews] = await Promise.all([api<Spa[]>('me/saved'), api<Booking[]>('me/bookings'), api<Review[]>('me/reviews')]);
  return <main className="container stack"><p><Link href="/vi">← Trang chủ</Link></p><h1>Xin chào, {user.fullName}</h1>
    <h2>Spa đã lưu</h2><div className="grid">{saved.map(spa => <div className="card stack" key={spa.id}><Link href={`/vi/spas/${spa.id}`}>{spa.name}</Link><MutationButton path={`me/saved/${spa.id}`} method="DELETE">Bỏ lưu</MutationButton></div>)}</div>{!saved.length && <p>Chưa lưu spa nào.</p>}
    <h2>Lịch đã đặt</h2>{bookings.map(item => <div className="card" key={item.id}>{item.spaName} · {new Date(item.scheduledAt).toLocaleString('vi-VN')} · <span className="pill">{item.status}</span></div>)}{!bookings.length && <p>Chưa có lịch đặt.</p>}
    <h2>Đánh giá của tôi</h2>{reviews.map(item => <div className="card" key={item.id}>{item.spaName} · {item.rating}/5 · {item.comment}</div>)}{!reviews.length && <p>Chưa có đánh giá.</p>}
  </main>;
}
