'use client';

import { create } from 'zustand';

type LocalizedSlugsState = {
  /**
   * Map locale → slug cho trang hiện tại.
   * null = chưa có dữ liệu (trang không phải spa/deal detail)
   */
  slugs: Record<string, string> | null;
  setLocalizedSlugs: (slugs: Record<string, string> | null) => void;
  clearLocalizedSlugs: () => void;
};

export const useLocalizedSlugsStore = create<LocalizedSlugsState>((set) => ({
  slugs: null,
  setLocalizedSlugs: (slugs) => set({ slugs }),
  clearLocalizedSlugs: () => set({ slugs: null }),
}));
