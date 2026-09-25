'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { requestJson, errorMessage } from '@/lib/client-api';

export function LogoutButton({
  className = 'button secondary',
  children = 'Đăng xuất',
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    setError('');
    try {
      await requestJson('/api/auth/logout', 'POST');
      router.replace('/login');
      router.refresh();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className={className} onClick={logout} disabled={busy}>
        {children}
      </button>
      {error && <small role="alert">{error}</small>}
    </>
  );
}
