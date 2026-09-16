'use client';

import type { ReactNode } from 'react';
import { useTransition } from 'react';
import { LayoutTemplate, LogOut, Sparkles, TicketPercent } from 'lucide-react';
import { useRouter } from 'next/navigation';

type TabKey = 'spas' | 'deals' | 'banners';

const navGroups: Array<{
  title: string;
  items: Array<{ key: TabKey; label: string }>;
}> = [
  {
    title: 'Supply',
    items: [
      { key: 'spas', label: 'Spas' },
      { key: 'deals', label: 'Deals' },
    ],
  },
  {
    title: 'Content',
    items: [{ key: 'banners', label: 'Banners' }],
  },
];

const tabIcons = {
  spas: Sparkles,
  deals: TicketPercent,
  banners: LayoutTemplate,
};

const tabDescriptions: Record<TabKey, { eyebrow: string; title: string }> = {
  spas: {
    eyebrow: 'Supply',
    title: 'Spa Inventory',
  },
  deals: {
    eyebrow: 'Supply',
    title: 'Deal Inventory',
  },
  banners: {
    eyebrow: 'Content',
    title: 'Banner Operations',
  },
};

export function AdminWorkspaceShell({
  activeTab,
  onTabChange,
  children,
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const current = tabDescriptions[activeTab];

  async function handleLogout() {
    await fetch('/admin/session', { method: 'DELETE' });
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f1e7_0%,#f8f7f2_42%,#eef2ea_100%)] px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] gap-5">
        <aside className="hidden w-[252px] shrink-0 rounded-[28px] border border-[#e7dfcf] bg-white/92 p-4 shadow-[0_20px_60px_-44px_rgba(24,38,29,0.55)] xl:flex xl:flex-col">
          <div className="rounded-[22px] border border-[#ece5d8] bg-[#faf6ef] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b7453]">Deals CMS</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#18261d]">Operations Admin</h1>
          </div>

          <div className="mt-5 flex-1 space-y-5">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8b7453]">{group.title}</p>
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const Icon = tabIcons[item.key];
                    const active = item.key === activeTab;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onTabChange(item.key)}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition ${
                          active
                            ? 'border-[#cfded3] bg-[#eef4ef] text-[#285b46]'
                            : 'border-transparent bg-transparent text-[#445248] hover:border-[#ece5d8] hover:bg-[#fbfaf7]'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className={active ? 'font-semibold' : 'font-medium'}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isPending}
            className="mt-5 flex items-center gap-3 rounded-2xl border border-[#ece5d8] bg-[#fbfaf7] px-3 py-3 text-left text-sm font-medium text-[#445248] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            <span>{isPending ? 'Signing out...' : 'Sign out'}</span>
          </button>
        </aside>

        <div className="min-w-0 flex-1 space-y-5">
          <section className="rounded-[28px] border border-[#e7dfcf] bg-white/92 p-6 shadow-[0_18px_50px_-42px_rgba(24,38,29,0.55)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8b7453]">{current.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#18261d]">{current.title}</h2>
          </section>

          {children}
        </div>
      </div>
    </div>
  );
}
