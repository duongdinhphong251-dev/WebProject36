import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';
import { buildPaginationMeta, PaginationMeta } from '../../common/dto/pagination.dto';
import { ListQueryDto, SortOrder } from '../../common/dto/list-query.dto';
import { dealWithinPublicationWindow } from '../../common/utils/deal-publication-window.util';
import { CityResponseDto } from './dto/city-response.dto';
import { DistrictResponseDto } from './dto/district-response.dto';
import { PlaceResponseDto } from './dto/place-response.dto';
import { WardResponseDto } from './dto/ward-response.dto';

// ─── Sort helpers ─────────────────────────────────────────────────────────────

const CITY_SORT_FIELDS: Record<string, unknown> = {
  nameVi: schema.cities.nameVi,
  nameEn: schema.cities.nameEn,
  nameKo: schema.cities.nameKo,
  slug: schema.cities.slug,
  priority: schema.cities.priority,
};

const DISTRICT_SORT_FIELDS: Record<string, unknown> = {
  nameVi: schema.districts.nameVi,
  nameEn: schema.districts.nameEn,
  nameKo: schema.districts.nameKo,
  slug: schema.districts.slug,
  priority: schema.districts.priority,
};

const WARD_SORT_FIELDS: Record<string, unknown> = {
  nameVi: schema.wards.nameVi,
  nameEn: schema.wards.nameEn,
  nameKo: schema.wards.nameKo,
  slug: schema.wards.slug,
  priority: schema.wards.priority,
};

const PLACE_SORT_FIELDS: Record<string, unknown> = {
  nameVi: schema.places.nameVi,
  nameEn: schema.places.nameEn,
  nameKo: schema.places.nameKo,
  slug: schema.places.slug,
  priority: schema.places.priority,
};

function resolveSortExpr(
  fieldMap: Record<string, unknown>,
  sortBy: string | undefined,
  order: SortOrder | undefined,
  defaultExprs: unknown[],
): unknown[] {
  const col = sortBy && fieldMap[sortBy];
  if (col) {
    return [order === SortOrder.DESC ? desc(col as any) : asc(col as any)];
  }
  return defaultExprs;
}

function paginate<T>(items: T[], page: number, limit: number): { data: T[]; meta: PaginationMeta } {
  const total = items.length;
  const data = items.slice((page - 1) * limit, page * limit);
  return { data, meta: buildPaginationMeta(page, limit, total) };
}

function buildPlaceSearchCondition(search: string): SQL {
  const trimmed = search.trim();
  const term = `%${trimmed}%`;
  const slugTerm = `%${trimmed.replace(/\s+/g, '-').toLowerCase()}%`;
  return or(
    ilike(schema.places.nameVi, term),
    ilike(schema.places.nameEn, term),
    ilike(schema.places.nameKo, term),
    ilike(schema.places.slug, slugTerm),
  )!;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class LocationsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) { }

  async getCities(
    query?: ListQueryDto,
  ): Promise<{ data: CityResponseDto[]; meta: PaginationMeta }> {
    const orderExprs = resolveSortExpr(
      CITY_SORT_FIELDS,
      query?.sortBy,
      query?.order,
      [asc(schema.cities.priority)],
    );

    const rows = await this.db
      .select({
        id: schema.cities.id,
        slug: schema.cities.slug,
        nameVi: schema.cities.nameVi,
        nameEn: schema.cities.nameEn,
        nameKo: schema.cities.nameKo,
        priority: schema.cities.priority,
      })
      .from(schema.cities)
      .where(eq(schema.cities.isActive, true))
      .orderBy(...(orderExprs as any[]));

    const items: CityResponseDto[] = rows.map((r) => ({
      id: r.id,
      slug: r.slug ?? '',
      nameVi: r.nameVi ?? '',
      nameEn: r.nameEn ?? null,
      nameKo: r.nameKo ?? null,
      priority: r.priority ?? 0,
      targetUrl: null,
    }));

    return paginate(items, query?.page ?? 1, query?.limit ?? 20);
  }

  async getDistrictsByCitySlug(
    citySlug: string,
    query?: ListQueryDto,
  ): Promise<{ data: DistrictResponseDto[]; meta: PaginationMeta }> {
    const [city] = await this.db
      .select({ id: schema.cities.id })
      .from(schema.cities)
      .where(and(eq(schema.cities.slug, citySlug), eq(schema.cities.isActive, true)))
      .limit(1);

    if (!city) throw new NotFoundException(`City "${citySlug}" not found`);

    const orderExprs = resolveSortExpr(
      DISTRICT_SORT_FIELDS,
      query?.sortBy,
      query?.order,
      [asc(schema.districts.priority)],
    );

    const rows = await this.db
      .select({
        id: schema.districts.id,
        slug: schema.districts.slug,
        nameVi: schema.districts.nameVi,
        nameEn: schema.districts.nameEn,
        nameKo: schema.districts.nameKo,
        cityId: schema.districts.cityId,
      })
      .from(schema.districts)
      .where(and(eq(schema.districts.cityId, city.id), eq(schema.districts.isActive, true)))
      .orderBy(...(orderExprs as any[]));

    const items: DistrictResponseDto[] = rows.map((r) => ({
      id: r.id,
      slug: r.slug ?? '',
      nameVi: r.nameVi ?? '',
      nameEn: r.nameEn ?? null,
      nameKo: r.nameKo ?? null,
      cityId: r.cityId ?? 0,
      targetUrl: null,
    }));

    return paginate(items, query?.page ?? 1, query?.limit ?? 20);
  }

  async getWardsByDistrictSlug(
    districtSlug: string,
    query?: ListQueryDto,
  ): Promise<{ data: WardResponseDto[]; meta: PaginationMeta }> {
    const [district] = await this.db
      .select({ id: schema.districts.id, cityId: schema.districts.cityId })
      .from(schema.districts)
      .where(and(eq(schema.districts.slug, districtSlug), eq(schema.districts.isActive, true)))
      .limit(1);

    if (!district) throw new NotFoundException(`District "${districtSlug}" not found`);

    const orderExprs = resolveSortExpr(
      WARD_SORT_FIELDS,
      query?.sortBy,
      query?.order,
      [asc(schema.wards.priority)],
    );

    const rows = await this.db
      .select()
      .from(schema.wards)
      .where(and(eq(schema.wards.districtId, district.id), eq(schema.wards.isActive, true)))
      .orderBy(...(orderExprs as any[]));

    const items: WardResponseDto[] = rows.map((r) => ({
      id: r.id,
      slug: r.slug ?? '',
      nameVi: r.nameVi ?? '',
      nameEn: r.nameEn ?? null,
      nameKo: r.nameKo ?? null,
      districtId: r.districtId ?? 0,
      cityId: r.cityId ?? 0,
    }));

    return paginate(items, query?.page ?? 1, query?.limit ?? 20);
  }

  async getPlacesByDistrictSlug(
    districtSlug: string,
    query?: ListQueryDto,
  ): Promise<{ data: PlaceResponseDto[]; meta: PaginationMeta }> {
    const [district] = await this.db
      .select({ id: schema.districts.id })
      .from(schema.districts)
      .where(and(eq(schema.districts.slug, districtSlug), eq(schema.districts.isActive, true)))
      .limit(1);

    if (!district) throw new NotFoundException(`District "${districtSlug}" not found`);

    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const offset = (page - 1) * limit;

    const orderExprs = resolveSortExpr(
      PLACE_SORT_FIELDS,
      query?.sortBy,
      query?.order,
      [asc(schema.places.priority), asc(schema.places.nameVi)],
    );

    const baseWhere = eq(schema.places.districtId, district.id);
    const search = query?.q?.trim();
    const whereClause = search ? and(baseWhere, buildPlaceSearchCondition(search)) : baseWhere;

    const [countRow] = await this.db
      .select({ total: count() })
      .from(schema.places)
      .where(whereClause);

    const total = Number(countRow?.total ?? 0);

    const rows = await this.db
      .select({
        id: schema.places.id,
        slug: schema.places.slug,
        nameVi: schema.places.nameVi,
        nameEn: schema.places.nameEn,
        nameKo: schema.places.nameKo,
        cityId: schema.places.cityId,
        districtId: schema.places.districtId,
        wardId: schema.places.wardId,
      })
      .from(schema.places)
      .where(whereClause)
      .orderBy(...(orderExprs as any[]))
      .limit(limit)
      .offset(offset);

    const data: PlaceResponseDto[] = rows.map((r) => ({
      id: r.id,
      slug: r.slug ?? '',
      nameVi: r.nameVi ?? '',
      nameEn: r.nameEn ?? null,
      nameKo: r.nameKo ?? null,
      cityId: r.cityId ?? null,
      districtId: r.districtId ?? null,
      wardId: r.wardId ?? null,
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }
}
