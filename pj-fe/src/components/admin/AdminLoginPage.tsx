'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const response = await fetch('/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      setError(payload?.message ?? 'Login failed');
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f1e7_0%,#f8f7f2_42%,#eef2ea_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-[460px] rounded-[32px] border border-[#e7dfcf] bg-white/95 p-8 shadow-[0_24px_64px_-44px_rgba(24,38,29,0.55)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b7453]">Deals CMS</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#18261d]">Admin Sign In</h1>

        <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" autoComplete="username" />
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />

          {error && <p className="rounded-[16px] bg-[#fff1ee] px-4 py-3 text-sm text-[#9a3d2f]">{error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
