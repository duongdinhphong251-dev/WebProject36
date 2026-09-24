'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Mode = 'login' | 'register' | 'register-owner';
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data: { message?: string; user?: { role: string } } = await response.json();
      if (!response.ok) { setError(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Có lỗi xảy ra'); return; }
      router.replace(data.user?.role === 'admin' ? '/admin' : data.user?.role === 'spa_owner' ? '/owner' : '/vi');
      router.refresh();
    } catch { setError('Không thể kết nối máy chủ'); }
    finally { setBusy(false); }
  }
  const owner = mode === 'register-owner';
  return <div className="auth card stack">
    <h1>{mode === 'login' ? 'Đăng nhập' : owner ? 'Đăng ký chủ spa' : 'Tạo tài khoản'}</h1>
    <form onSubmit={submit} className="stack">
      {mode !== 'login' && <label>Họ tên<input className="input" name="fullName" required /></label>}
      <label>Số điện thoại<input className="input" name="phone" inputMode="tel" pattern="0[0-9]{9,10}" required /></label>
      <label>Mật khẩu<input className="input" name="password" type="password" minLength={mode === 'login' ? 1 : 8} required /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button" disabled={busy}>{busy ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</button>
    </form>
    <div className="row">
      {mode !== 'login' && <Link href="/login">Đã có tài khoản?</Link>}
      {mode === 'login' && <><Link href="/register">Đăng ký người dùng</Link><Link href="/register/owner">Đăng ký chủ spa</Link></>}
    </div>
  </div>;
}
