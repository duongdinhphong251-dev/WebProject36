import type { SeoNodeRow } from '../url-resolver/dto/resolved-context';

export type SeoLocaleCode = 'vi' | 'en' | 'ko';

/** Entity context used to fill `$placeholder` values in seo_templates patterns. */
export interface SeoRenderEntities {
  serviceName: string;
  cityName: string;
  districtName: string;
  wardName: string;
}

export interface SeoComposeInput {
  locale: SeoLocaleCode;
  /** Live listing total for the current filters (preferred over node counters). */
  dealCount: number;
  spaCount?: number | null;
  seoNode: SeoNodeRow | null;
  entities: SeoRenderEntities;
}

export interface SeoRenderedFields {
  h1: string;
  title: string;
  metaDescription: string;
}
