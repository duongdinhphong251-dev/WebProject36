import { cache } from 'react';
import { createTranslation as createTranslationBase } from '@/i18n/server';

/**
 * Cached translation fetcher.
 * Wraps createTranslation with React.cache() to deduplicate
 * calls across generateMetadata and page components.
 *
 * Usages:
 *   const { t } = await getTranslation(locale, 'home');
 */
export const getTranslation = cache(createTranslationBase);

// Re-export types for convenience
export type { TFunction } from 'i18next';
