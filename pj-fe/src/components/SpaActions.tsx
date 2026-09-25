'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { requestJson, errorMessage } from '@/lib/client-api';

export function SpaActions({
  spaId,
  role,
  dealId,
  voucherStatus,
  locale,
}: {
  spaId: string;
  role: string;
  dealId?: number;
  voucherStatus?: string;
  locale: string;
}) {
  const english = locale === 'en';
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function send(path: string, method: 'POST', body?: object) {
    setBusy(true);
    setMessage('');
    try {
      await requestJson(`/api/backend/${path}`, method, body);
      setMessage(
        path === 'me/bookings'
          ? english
            ? 'Booking created.'
            : 'Đặt lịch thành công.'
          : path === 'me/reviews'
            ? english
              ? 'Review submitted.'
              : 'Đã gửi đánh giá.'
            : english
              ? 'Spa saved.'
              : 'Đã lưu spa.',
      );
      router.refresh();
      return true;
    } catch (error) {
      setMessage(
        errorMessage(
          error,
          english
            ? 'Could not connect to the server.'
            : 'Không thể kết nối máy chủ.',
        ),
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (
      await send('me/reviews', 'POST', {
        spaId,
        rating: Number(data.get('rating')),
        comment: String(data.get('comment')),
      })
    )
      form.reset();
  }
  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (
      await send('me/bookings', 'POST', {
        spaId,
        ...(dealId ? { dealId } : {}),
        scheduledAt: new Date(String(data.get('scheduledAt'))).toISOString(),
      })
    )
      form.reset();
  }
  if (role !== 'user') return null;
  return (
    <section className="stack">
      <h2>{english ? 'Actions' : 'Thao tác'}</h2>
      <button
        className="button secondary"
        disabled={busy}
        onClick={() => void send(`me/saved/${spaId}`, 'POST')}
      >
        {english ? 'Save spa' : 'Lưu spa yêu thích'}
      </button>
      {!dealId || voucherStatus === 'available' ? (
        <form className="card stack" onSubmit={(event) => void book(event)}>
          <strong>
            {dealId
              ? english
                ? 'Book with this voucher'
                : 'Đặt lịch với voucher này'
              : english
                ? 'Book a visit'
                : 'Đặt lịch'}
          </strong>
          <label>
            {english ? 'Time' : 'Thời gian'}
            <input
              className="input"
              name="scheduledAt"
              type="datetime-local"
              required
            />
          </label>
          <button className="button" disabled={busy}>
            {english ? 'Book' : 'Đặt lịch'}
          </button>
        </form>
      ) : (
        <p className="card">
          {voucherStatus === 'used'
            ? english
              ? 'This voucher has already been used.'
              : 'Voucher này đã được dùng.'
            : english
              ? 'Claim the voucher above before booking.'
              : 'Hãy nhận voucher ở trên trước khi đặt lịch.'}
        </p>
      )}
      <form className="card stack" onSubmit={(event) => void review(event)}>
        <strong>{english ? 'Review' : 'Đánh giá'}</strong>
        <label>
          {english ? 'Rating' : 'Số sao'}
          <select className="input" name="rating">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} {english ? 'stars' : 'sao'}
              </option>
            ))}
          </select>
        </label>
        <label>
          {english ? 'Comment' : 'Nhận xét'}
          <textarea className="input" name="comment" required />
        </label>
        <button className="button" disabled={busy}>
          {english ? 'Submit review' : 'Gửi đánh giá'}
        </button>
      </form>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
