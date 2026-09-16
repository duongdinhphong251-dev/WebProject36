import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';
import { PageType, ResolvedPageContext, SeoNodeRow } from './dto/resolved-context';

@Injectable()
export class UrlResolverService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) { }

  /**
   * Resolve a page URL to its context by looking up seo_nodes.
   * URL may include a leading slash — it is normalized before lookup.
   */
  async resolve(url: string, locale: string): Promise<ResolvedPageContext> {
    const normalizedUrl = url.replace(/^\//, '').toLowerCase().trim().replace(/\/+$/, '');

    /** Trang "Xem tất cả" cho danh sách ưu đãi và địa điểm spa — không map qua seo_nodes; list toàn bộ spa/deal (giống home, có phân trang). */
    if (
      normalizedUrl === 'deals' ||
      normalizedUrl === 'organization_services' ||
      normalizedUrl === 'spas' ||
      normalizedUrl === 'spa' ||
      normalizedUrl === 'open-spas' ||
      normalizedUrl === 'spa-dang-mo'
    ) {
      return {
        seoNode: null,
        pageType: 'category',
        categoryId: null,
        cityId: null,
        districtId: null,
        wardId: null,
      };
    }

    /** Hub flash sale — layout giống category hub, chỉ deal đang trong khung flash (slot hoặc start/end). */
    if (normalizedUrl === 'flash-sale') {
      return {
        seoNode: null,
        pageType: 'category',
        categoryId: null,
        cityId: null,
        districtId: null,
        wardId: null,
        flashSaleHub: true,
      };
    }

    const nodes = await this.db
      .select()
      .from(schema.seoNodes)
      .where(
        and(
          eq(schema.seoNodes.url, normalizedUrl),
          eq(schema.seoNodes.publishStatus, 'published'),
          inArray(schema.seoNodes.locale, [locale, 'vi'])
        )
      );

    const node = nodes.find((n) => n.locale === locale) ?? nodes.find((n) => n.locale === 'vi') ?? null;


    if (!node) {
      const [cityHit] = await this.db
        .select({ id: schema.cities.id })
        .from(schema.cities)
        .where(
          and(
            eq(schema.cities.slug, normalizedUrl),
            eq(schema.cities.isActive, true),
          ),
        )
        .limit(1);

      if (cityHit) {
        return {
          seoNode: null,
          pageType: 'city',
          categoryId: null,
          cityId: Number(cityHit.id),
          districtId: null,
          wardId: null,
        };
      }

      const [serviceHit] = await this.db
        .select({ id: schema.services.id })
        .from(schema.services)
        .where(
          and(
            eq(schema.services.isActive, true),
            or(
              eq(schema.services.slugGlobal, normalizedUrl),
              eq(schema.services.slugVi, normalizedUrl),
              eq(schema.services.slugEn, normalizedUrl),
              eq(schema.services.slugKo, normalizedUrl),
            ),
          ),
        )
        .limit(1);

      if (serviceHit) {
        return {
          seoNode: null,
          pageType: 'category',
          categoryId: Number(serviceHit.id),
          cityId: null,
          districtId: null,
          wardId: null,
        };
      }

      return {
        seoNode: null,
        pageType: 'not_found',
        categoryId: null,
        cityId: null,
        districtId: null,
        wardId: null,
      };
    }
    return {
      seoNode: node,
      pageType: this.inferPageType(node),
      categoryId: node.categoryId ?? null,
      cityId: node.cityId ?? null,
      districtId: node.districtId ?? null,
      wardId: node.wardId ?? null,
    };
  }

  /**
   * Derive pageType from the node_type field.
   * Falls back to checking which IDs are populated if node_type is not set.
   */
  private inferPageType(node: SeoNodeRow): PageType {
    switch (node.nodeType) {
      case 'category': return 'category';
      case 'city': return 'city';
      case 'district': return 'district';
      case 'ward': return 'district'; // ward pages use district-level layout
      case 'place': return 'district'; // place hub: same listing layout as district + place filter
    }

    // Fallback: infer from populated IDs
    if (node.districtId || node.wardId) return 'district';
    if (node.cityId) return 'city';
    if (node.categoryId) return 'category';

    return 'category';
  }
}
