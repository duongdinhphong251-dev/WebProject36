'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function MutationButton({ path, method, body, children }: { path: string; method: 'POST' | 'PATCH' | 'DELETE'; body?: object; children: React.ReactNode }) {
  const router = useRouter(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/backend/${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const data: { message?: string } = await response.json();
      if (!response.ok) setError(data.message || 'Có lỗi xảy ra'); else router.refresh();
    } catch { setError('Không thể kết nối máy chủ'); }
    finally { setBusy(false); }
  }
  return <span><button type="button" className="button secondary" onClick={run} disabled={busy}>{children}</button>{error && <small className="error"> {error}</small>}</span>;
}
