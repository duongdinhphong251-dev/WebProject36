'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { requestJson, errorMessage } from '@/lib/client-api';

export function MutationButton({
  path,
  method,
  body,
  children,
}: {
  path: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body?: object;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    setError('');
    try {
      await requestJson(`/api/backend/${path}`, method, body);
      router.refresh();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <span>
      <button
        type="button"
        className="button secondary"
        onClick={run}
        disabled={busy}
      >
        {children}
      </button>
      {error && <small className="error"> {error}</small>}
    </span>
  );
}
