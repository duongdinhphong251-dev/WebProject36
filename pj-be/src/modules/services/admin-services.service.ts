import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, ilike, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ListQueryDto, SortOrder } from '../../common/dto/list-query.dto';
import { buildPaginationMeta, PaginationMeta } from '../../common/dto/pagination.dto';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';
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

@Injectable()
export class AdminServicesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async list(query?: ListQueryDto): Promise<{ data: ServiceResponseDto[]; meta: PaginationMeta }> {
    const col = query?.sortBy && SERVICE_SORT_FIELDS[query.sortBy];
    const orderExpr = col
      ? query?.order === SortOrder.DESC ? desc(col as any) : asc(col as any)
      : asc(schema.services.sortOrder);

    const conditions = [eq(schema.services.isActive, true)];
    if (query?.q?.trim()) {
      const term = `%${query.q.trim()}%`;
      conditions.push(or(
        ilike(schema.services.nameVi, term),
        ilike(schema.services.nameEn, term),
        ilike(schema.services.nameKo, term),
        ilike(schema.services.slugGlobal, term),
        ilike(schema.services.code, term),
      )!);
    }

    const rows = await this.db
      .select()
      .from(schema.services)
      .where(and(...conditions))
      .orderBy(orderExpr);

    const items: ServiceResponseDto[] = rows.map((r) => ({
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

    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const total = items.length;

    return {
      data: items.slice((page - 1) * limit, page * limit),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: number): Promise<ServiceResponseDto> {
    const [service] = await this.db
      .select()
      .from(schema.services)
      .where(eq(schema.services.id, id))
      .limit(1);

    if (!service) {
      throw new NotFoundException(`Service ${id} not found`);
    }

    return {
      id: service.id,
      code: service.code ?? '',
      nameVi: service.nameVi ?? '',
      nameEn: service.nameEn ?? null,
      nameKo: service.nameKo ?? null,
      slugVi: service.slugVi ?? null,
      slugEn: service.slugEn ?? null,
      slugKo: service.slugKo ?? null,
      slugGlobal: service.slugGlobal ?? '',
      sortOrder: service.sortOrder ?? 0,
      categoryId: service.categoryId ?? null,
      targetUrl: null,
    };
  }
}
