'use client';

import { useEffect } from 'react';
import { useLocalizedSlugsStore } from '@/stores/localized-slugs/useLocalizedSlugsStore';

interface LocalizedSlugSyncProps {
  localizedSlugs: Record<string, string>;
}

/**
 * Syncs a page's localizedSlugs into the global store so the LocaleSwitcher
 * can navigate to the correct slug when changing language.
 * Renders nothing — purely a side-effect component.
 * Use on any detail page that has locale-specific slugs (spa, deal, etc.).
 */
export function LocalizedSlugSync({ localizedSlugs }: LocalizedSlugSyncProps) {
  const setLocalizedSlugs = useLocalizedSlugsStore((s) => s.setLocalizedSlugs);
  const clearLocalizedSlugs = useLocalizedSlugsStore((s) => s.clearLocalizedSlugs);

  useEffect(() => {
    setLocalizedSlugs(localizedSlugs);
    return () => clearLocalizedSlugs();
  }, [localizedSlugs, setLocalizedSlugs, clearLocalizedSlugs]);

  return null;
}
