'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function SpaActions({ spaId, role, dealId, locale }: { spaId: string; role: string; dealId?: number; locale: string }) {
  const english = locale === 'en';
  const router = useRouter();
  const [message, setMessage] = useState('');
  async function send(path: string, method: string, body?: object) {
    const response = await fetch(`/api/backend/${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const result: { message?: string | string[] } = await response.json();
    setMessage(response.ok ? (english ? 'Saved successfully.' : 'Đã lưu thành công.') : Array.isArray(result.message) ? result.message.join(', ') : result.message || (english ? 'An error occurred' : 'Có lỗi xảy ra'));
    if (response.ok) router.refresh();
  }
  function review(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); void send('me/reviews', 'POST', { spaId, rating: Number(data.get('rating')), comment: String(data.get('comment')) }); }
  function book(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); void send('me/bookings', 'POST', { spaId, ...(dealId ? { dealId } : {}), scheduledAt: new Date(String(data.get('scheduledAt'))).toISOString() }); }
  if (role !== 'user') return null;
  return <section className="stack"><h2>{english ? 'Actions' : 'Thao tác'}</h2><button className="button secondary" onClick={() => void send(`me/saved/${spaId}`, 'POST')}>{english ? 'Save spa' : 'Lưu spa yêu thích'}</button>
    <form className="card stack" onSubmit={book}><strong>{english ? 'Book a visit' : 'Đặt lịch'}</strong><label>{english ? 'Time' : 'Thời gian'}<input className="input" name="scheduledAt" type="datetime-local" required /></label><button className="button">{english ? 'Book' : 'Đặt lịch'}</button></form>
    <form className="card stack" onSubmit={review}><strong>{english ? 'Review' : 'Đánh giá'}</strong><label>{english ? 'Rating' : 'Số sao'}<select className="input" name="rating">{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} {english ? 'stars' : 'sao'}</option>)}</select></label><label>{english ? 'Comment' : 'Nhận xét'}<textarea className="input" name="comment" required /></label><button className="button">{english ? 'Submit review' : 'Gửi đánh giá'}</button></form>
    {message && <p role="status">{message}</p>}
  </section>;
}
