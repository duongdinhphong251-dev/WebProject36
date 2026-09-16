'use client';

import { useEffect } from 'react';
import { useLocalizedSlugsStore } from '@/stores/localized-slugs/useLocalizedSlugsStore';

interface SpaSlugSyncProps {
  localizedSlugs: Record<string, string>;
}

/**
 * Syncs the spa's localizedSlugs into the global store so the LocaleSwitcher
 * can navigate to the correct slug when changing language.
 * Renders nothing — purely a side-effect component.
 */
export function SpaSlugSync({ localizedSlugs }: SpaSlugSyncProps) {
  const setLocalizedSlugs = useLocalizedSlugsStore((s) => s.setLocalizedSlugs);
  const clearLocalizedSlugs = useLocalizedSlugsStore((s) => s.clearLocalizedSlugs);

  useEffect(() => {
    setLocalizedSlugs(localizedSlugs);
    return () => clearLocalizedSlugs();
  }, [localizedSlugs, setLocalizedSlugs, clearLocalizedSlugs]);

  return null;
}
