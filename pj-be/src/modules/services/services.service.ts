import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq, and, isNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';
import { ListQueryDto, SortOrder } from '../../common/dto/list-query.dto';
import { ServiceResponseDto } from './dto/service-response.dto';

const SERVICE_SORT_FIELDS: Record<string, unknown> = {
  nameVi: schema.services.nameVi,
  nameEn: schema.services.nameEn,
  nameKo: schema.services.nameKo,
  slugVi: schema.services.slugVi,
  slugEn: schema.services.slugEn,
  slugKo: schema.services.slugKo,
  slugGlobal: schema.services.slugGlobal,
  sortOrder: schema.services.sortOrder,
  code: schema.services.code,
};

/**
 * TẠM THỜI: Ánh xạ ID service cũ (đang dùng trong seo_nodes) sang ID nhóm mới (đang dùng cho sub-service),
 * do seo_nodes chưa được migrate sang cấu trúc ID mới.
 * Xoá mapping này khi seo_nodes được cập nhật.
 */
export const LEGACY_PARENT_SERVICE_ID_MAP: Record<number, number> = {
  1: 40,  // massage -> MASSAGE_SPA
  2: 41,  // nail -> BEAUTY
  4: 40,  // ear_spa -> MASSAGE_SPA
  5: 40,  // head_spa -> MASSAGE_SPA
  6: 40,  // skincare -> MASSAGE_SPA
  7: 41,  // lashes_brows -> BEAUTY
  8: 41,  // nails -> BEAUTY
  9: 41,  // hair_removal -> BEAUTY
  10: 46, // dental -> HEALTH
  11: 41, // hair -> BEAUTY
  12: 46, // fitness -> HEALTH
  13: 42, // restaurant -> FOOD_DRINK
};

@Injectable()
export class ServicesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getServices(query?: ListQueryDto): Promise<ServiceResponseDto[]> {
    const col = query?.sortBy && SERVICE_SORT_FIELDS[query.sortBy];
    const orderExpr = col
      ? query?.order === SortOrder.DESC ? desc(col as any) : asc(col as any)
      : asc(schema.services.sortOrder);

    const rows = await this.db
      .select()
      .from(schema.services)
      .where(and(eq(schema.services.isActive, true), isNull(schema.services.categoryId)))
      .orderBy(orderExpr);

    return rows.map((r) => ({
      id: r.id,
      code: r.code ?? '',
      nameVi: r.nameVi ?? '',
      nameEn: r.nameEn ?? null,
      nameKo: r.nameKo ?? null,
      slugVi: r.slugVi ?? null,
      slugEn: r.slugEn ?? null,
      slugKo: r.slugKo ?? null,
      slugGlobal: r.slugGlobal ?? '',
      sortOrder: r.sortOrder ?? 0,
      categoryId: r.categoryId ?? null,
      targetUrl: null,
    }));
  }

  async getSubServices(parentServiceId: number): Promise<ServiceResponseDto[]> {
    const targetParentId = LEGACY_PARENT_SERVICE_ID_MAP[parentServiceId] ?? parentServiceId;

    const rows = await this.db
      .select()
      .from(schema.services)
      .where(and(eq(schema.services.isActive, true), eq(schema.services.categoryId, targetParentId)))
      .orderBy(asc(schema.services.sortOrder));

    return rows.map((r) => ({
      id: r.id,
      code: r.code ?? '',
      nameVi: r.nameVi ?? '',
      nameEn: r.nameEn ?? null,
      nameKo: r.nameKo ?? null,
      slugVi: r.slugVi ?? null,
      slugEn: r.slugEn ?? null,
      slugKo: r.slugKo ?? null,
      slugGlobal: r.slugGlobal ?? '',
      sortOrder: r.sortOrder ?? 0,
      categoryId: r.categoryId ?? null,
      targetUrl: null,
    }));
  }

  async getServiceById(id: number): Promise<ServiceResponseDto | null> {
    const rows = await this.db
      .select()
      .from(schema.services)
      .where(eq(schema.services.id, id))
      .limit(1);

    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      code: r.code ?? '',
      nameVi: r.nameVi ?? '',
      nameEn: r.nameEn ?? null,
      nameKo: r.nameKo ?? null,
      slugVi: r.slugVi ?? null,
      slugEn: r.slugEn ?? null,
      slugKo: r.slugKo ?? null,
      slugGlobal: r.slugGlobal ?? '',
      sortOrder: r.sortOrder ?? 0,
      categoryId: r.categoryId ?? null,
      targetUrl: null,
    };
  }

  async getAllServices(): Promise<ServiceResponseDto[]> {
    const rows = await this.db
      .select()
      .from(schema.services)
      .where(eq(schema.services.isActive, true))
      .orderBy(asc(schema.services.sortOrder));

    return rows.map((r) => ({
      id: r.id,
      code: r.code ?? '',
      nameVi: r.nameVi ?? '',
      nameEn: r.nameEn ?? null,
      nameKo: r.nameKo ?? null,
      slugVi: r.slugVi ?? null,
      slugEn: r.slugEn ?? null,
      slugKo: r.slugKo ?? null,
      slugGlobal: r.slugGlobal ?? '',
      sortOrder: r.sortOrder ?? 0,
      categoryId: r.categoryId ?? null,
      targetUrl: null,
    }));
  }
}
