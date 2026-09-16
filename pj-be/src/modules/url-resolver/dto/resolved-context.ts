import type { InferSelectModel } from 'drizzle-orm';
import type { seoNodes } from '../../../db/schema/seo.schema';

export type PageType = 'category' | 'city' | 'district' | 'not_found';

export type SeoNodeRow = InferSelectModel<typeof seoNodes>;

/**
 * Result returned by UrlResolverService.resolve().
 * Contains the raw seo_node row (for SEO meta) and the resolved entity IDs.
 */
export interface ResolvedPageContext {
  seoNode: SeoNodeRow | null;
  pageType: PageType;
  /** services.id */
  categoryId: number | null;
  /** cities.id */
  cityId: number | null;
  /** districts.id */
  districtId: number | null;
  /** wards.id */
  wardId: number | null;
  /** URL `flash-sale` — listing deal đang flash, không lọc theo category */
  flashSaleHub?: boolean;
}
