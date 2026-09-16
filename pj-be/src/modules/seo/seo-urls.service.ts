import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, gte, inArray, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';
import { buildPaginationMeta, PaginationMeta } from '../../common/dto/pagination.dto';
import {
  assertSeoLocales,
  assertSeoNodeTypes,
  SeoUrlsQueryDto,
} from './dto/seo-urls-query.dto';
import { SeoUrlItemDto } from './dto/seo-url-item.dto';

function parseCsvParam(raw?: string): string[] | undefined {
  if (!raw?.trim()) return undefined;
  const parts = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

@Injectable()
export class SeoUrlsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private buildWhere(query: SeoUrlsQueryDto): SQL | undefined {
    const nodeTypes = parseCsvParam(query.nodeType);
    if (nodeTypes?.length) {
      try {
        assertSeoNodeTypes(nodeTypes);
      } catch (e) {
        throw new BadRequestException((e as Error).message);
      }
    }

    const locales = parseCsvParam(query.locale);
    if (locales?.length) {
      try {
        assertSeoLocales(locales);
      } catch (e) {
        throw new BadRequestException((e as Error).message);
      }
    }

    const conditions: SQL[] = [];

    if (nodeTypes?.length) {
      conditions.push(inArray(schema.seoNodes.nodeType, nodeTypes));
    }
    if (locales?.length) {
      conditions.push(inArray(schema.seoNodes.locale, locales));
    }
    if (query.categoryId != null) {
      conditions.push(eq(schema.seoNodes.categoryId, query.categoryId));
    }
    if (query.cityId != null) {
      conditions.push(eq(schema.seoNodes.cityId, query.cityId));
    }
    if (query.districtId != null) {
      conditions.push(eq(schema.seoNodes.districtId, query.districtId));
    }
    if (query.wardId != null) {
      conditions.push(eq(schema.seoNodes.wardId, query.wardId));
    }

    const inSitemap = query.inSitemap ?? true;
    conditions.push(eq(schema.seoNodes.inSitemap, inSitemap));

    const indexable = query.indexable ?? true;
    conditions.push(eq(schema.seoNodes.indexable, indexable));

    const publishStatus = query.publishStatus ?? 'published';
    conditions.push(eq(schema.seoNodes.publishStatus, publishStatus));

    if (query.minDealCount != null) {
      conditions.push(gte(schema.seoNodes.dealCount, query.minDealCount));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  async listUrls(
    query: SeoUrlsQueryDto,
  ): Promise<{ data: SeoUrlItemDto[]; meta: PaginationMeta }> {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 500;
    const offset = (page - 1) * limit;

    const baseCount = this.db.select({ total: count() }).from(schema.seoNodes);
    const countQuery = where ? baseCount.where(where) : baseCount;
    const [{ total }] = await countQuery;

    const baseSelect = this.db
      .select({
        url: schema.seoNodes.url,
        locale: schema.seoNodes.locale,
        nodeType: schema.seoNodes.nodeType,
        categoryId: schema.seoNodes.categoryId,
        cityId: schema.seoNodes.cityId,
        districtId: schema.seoNodes.districtId,
        wardId: schema.seoNodes.wardId,
        placeId: schema.seoNodes.placeId,
        dealCount: schema.seoNodes.dealCount,
        spaCount: schema.seoNodes.spaCount,
        updatedAt: schema.seoNodes.updatedAt,
      })
      .from(schema.seoNodes)
      .orderBy(
        asc(schema.seoNodes.nodeType),
        asc(schema.seoNodes.categoryId),
        asc(schema.seoNodes.cityId),
        asc(schema.seoNodes.id),
      )
      .limit(limit)
      .offset(offset);

    const rows = where ? await baseSelect.where(where) : await baseSelect;

    const data: SeoUrlItemDto[] = rows.map((r) => ({
      url: r.url ?? '',
      locale: r.locale ?? 'vi',
      nodeType: r.nodeType ?? '',
      categoryId: r.categoryId,
      cityId: r.cityId,
      districtId: r.districtId,
      wardId: r.wardId,
      placeId: r.placeId,
      dealCount: r.dealCount,
      spaCount: r.spaCount,
      updatedAt: r.updatedAt?.toISOString() ?? null,
    }));

    return {
      data,
      meta: buildPaginationMeta(page, limit, Number(total)),
    };
  }

  async countUrls(query: SeoUrlsQueryDto): Promise<{ total: number }> {
    const where = this.buildWhere(query);
    const baseCount = this.db.select({ total: count() }).from(schema.seoNodes);
    const countQuery = where ? baseCount.where(where) : baseCount;
    const [{ total }] = await countQuery;
    return { total: Number(total) };
  }
}
