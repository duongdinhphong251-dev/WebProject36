'use client';

import { useState } from 'react';
import { AdminBannerPage } from './AdminBannerPage';
import { AdminDealPage } from './AdminDealPage';
import { AdminSpaPage } from './AdminSpaPage';
import { AdminWorkspaceShell } from './AdminWorkspaceShell';

type TabKey = 'spas' | 'deals' | 'banners';

export function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('spas');

  return (
    <AdminWorkspaceShell activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'spas' && <AdminSpaPage />}
        {activeTab === 'deals' && <AdminDealPage />}
        {activeTab === 'banners' && <AdminBannerPage embedded />}
    </AdminWorkspaceShell>
  );
}
