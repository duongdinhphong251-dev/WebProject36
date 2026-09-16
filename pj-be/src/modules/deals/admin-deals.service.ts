import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { buildPaginationMeta, PaginationMeta } from '../../common/dto/pagination.dto';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';
import { buildLocalizedSlug } from '../../common/utils/deal-localization.util';
import { AdminDealDetailDto, AdminDealListQueryDto, AdminDealSummaryDto, UpsertAdminDealDto } from './dto/admin-deal.dto';
import { DealCoverStorageService } from './deal-cover-storage.service';
import { PhotoCacheService } from '../../common/photo-cache/photo-cache.service';

@Injectable()
export class AdminDealsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly dealCoverStorage: DealCoverStorageService,
    private readonly photoCache: PhotoCacheService,
  ) { }

  async list(query: AdminDealListQueryDto = new AdminDealListQueryDto()): Promise<{ data: AdminDealSummaryDto[]; meta: PaginationMeta }> {
    const conditions = [];
    if (query.q?.trim()) {
      const term = `%${query.q.trim()}%`;
      conditions.push(or(
        ilike(schema.deals.titleVi, term),
        ilike(schema.deals.slugVi, term),
        ilike(schema.spas.name, term),
      ));
    }
    if (query.status?.trim()) {
      let mappedStatus = query.status.trim();
      if (mappedStatus === 'inactive') mappedStatus = 'expired';
      conditions.push(eq(schema.deals.status, mappedStatus));
    }
    if (query.spaId?.trim()) {
      conditions.push(eq(schema.deals.spaId, query.spaId.trim()));
    }

    const rows = await this.db
      .select({
        id: schema.deals.id,
        slug: schema.deals.slugVi,
        title: schema.deals.titleVi,
        spaId: schema.deals.spaId,
        spaName: schema.spas.name,
        status: schema.deals.status,
        startAt: schema.deals.startAt,
        endAt: schema.deals.endAt,
        updatedAt: schema.deals.updatedAt,
      })
      .from(schema.deals)
      .innerJoin(schema.spas, eq(schema.spas.id, schema.deals.spaId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.deals.updatedAt), desc(schema.deals.createdAt));

    const items = rows.map((row) => ({
      id: row.id,
      slug: row.slug ?? `deal-${row.id}`,
      title: row.title ?? '',
      spaId: row.spaId ?? '',
      spaName: row.spaName ?? '',
      status: row.status === 'expired' ? 'inactive' : (row.status ?? null),
      startAt: row.startAt ?? null,
      endAt: row.endAt ?? null,
      updatedAt: row.updatedAt ?? null,
    }));
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const total = items.length;

    return {
      data: items.slice((page - 1) * limit, page * limit),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: number): Promise<AdminDealDetailDto> {
    const deal = await this.findDeal(id);
    const [labels] = await this.db
      .select({
        spaName: schema.spas.name,
        categoryName: schema.services.nameVi,
        categorySlug: schema.services.slugGlobal,
      })
      .from(schema.deals)
      .innerJoin(schema.spas, eq(schema.spas.id, schema.deals.spaId))
      .leftJoin(schema.services, eq(schema.services.id, schema.deals.categoryId))
      .where(eq(schema.deals.id, id))
      .limit(1);
    const media = await this.db
      .select()
      .from(schema.dealMedia)
      .where(eq(schema.dealMedia.dealId, id))
      .orderBy(schema.dealMedia.sortOrder, schema.dealMedia.id);

    const variants = await this.db
      .select()
      .from(schema.dealVariants)
      .where(eq(schema.dealVariants.dealId, id))
      .orderBy(schema.dealVariants.sortOrder, schema.dealVariants.id);

    const variantIds = variants.map((variant) => variant.id);
    const prices = variantIds.length
      ? await this.db.select().from(schema.dealVariantPrices).where(or(...variantIds.map((variantId) => eq(schema.dealVariantPrices.variantId, variantId))))
      : [];
    const timeSlots = variantIds.length
      ? await this.db.select().from(schema.dealTimeSlots).where(or(...variantIds.map((variantId) => eq(schema.dealTimeSlots.variantId, variantId))))
      : [];
    const coverImagePreviewUrl = await this.photoCache.toDisplayUrl(deal.coverImageUrl);

    return {
      id: deal.id,
      slugVi: deal.slugVi ?? `deal-${deal.id}`,
      spaName: labels?.spaName ?? null,
      categoryName: labels?.categoryName ?? null,
      categorySlug: labels?.categorySlug ?? null,
      slugEn: deal.slugEn ?? null,
      slugKo: deal.slugKo ?? null,
      spaId: deal.spaId ?? '',
      titleVi: deal.titleVi ?? '',
      titleEn: deal.titleEn ?? '',
      titleKo: deal.titleKo ?? '',
      shortDescriptionVi: deal.shortDescriptionVi ?? null,
      shortDescriptionEn: deal.shortDescriptionEn ?? null,
      shortDescriptionKo: deal.shortDescriptionKo ?? null,
      contentVi: deal.contentVi ?? '',
      contentEn: deal.contentEn ?? '',
      contentKo: deal.contentKo ?? '',
      coverImageUrl: deal.coverImageUrl ?? null,
      coverImagePreviewUrl: coverImagePreviewUrl ?? deal.coverImageUrl ?? null,
      status: deal.status === 'expired' ? 'inactive' : (deal.status ?? null),
      startAt: deal.startAt?.toISOString() ?? null,
      endAt: deal.endAt?.toISOString() ?? null,
      isSoldOut: deal.isSoldOut ?? false,
      priorityScore: deal.priorityScore ?? null,
      currency: deal.currency ?? null,
      discountPercent: deal.discountPercent ?? null,
      discountedService: deal.discountedService ?? null,
      priceRange: deal.priceRange ?? null,
      reportCount: deal.reportCount ?? null,
      createdAt: deal.createdAt ?? null,
      updatedAt: deal.updatedAt ?? null,
    };
  }

  async create(body: UpsertAdminDealDto): Promise<AdminDealDetailDto> {
    await this.assertSpaExists(body.spaId);
    this.validateBody(body);
    const categoryId = await this.resolveCategoryIdFromSpa(body.spaId);
    const serviceTags = await this.resolveServiceTagsFromSpa(body.spaId);

    const now = new Date();
    const [created] = await this.db
      .insert(schema.deals)
      .values({
        id: sql`default`,
        spaId: body.spaId,
        categoryId,
        serviceTags,
        titleVi: body.titleVi.trim(),
        titleEn: this.cleanNullable(body.titleEn),
        titleKo: this.cleanNullable(body.titleKo),
        shortDescriptionVi: this.cleanNullable(body.shortDescriptionVi),
        shortDescriptionEn: this.cleanNullable(body.shortDescriptionEn),
        shortDescriptionKo: this.cleanNullable(body.shortDescriptionKo),
        contentVi: this.cleanNullable(body.contentVi),
        contentEn: this.cleanNullable(body.contentEn),
        contentKo: this.cleanNullable(body.contentKo),
        coverImageUrl: this.cleanNullable(body.coverImageUrl),
        status: this.normalizeStatus(body.status),
        startAt: this.toDate(body.startAt),
        endAt: this.toDate(body.endAt),
        isSoldOut: body.isSoldOut ?? false,
        priorityScore: body.priorityScore ?? 0,
        currency: this.cleanNullable(body.currency) ?? 'VND',
        discountPercent: this.cleanNullable(body.discountPercent),
        discountedService: this.cleanNullable(body.discountedService),
        priceRange: this.cleanNullable(body.priceRange),
        source: 'cms_admin',
        reportCount: body.reportCount ?? 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await this.syncSlugs(created.id, body);
    await this.syncGeoFromSpa(created.id, body.spaId);
    return this.getById(created.id);
  }

  async update(id: number, body: UpsertAdminDealDto): Promise<AdminDealDetailDto> {
    const existing = await this.findDeal(id);
    await this.assertSpaExists(body.spaId);
    this.validateBody(body);
    let categoryId = await this.resolveCategoryIdFromSpa(body.spaId, true);
    if (!categoryId && existing.spaId === body.spaId) {
      categoryId = existing.categoryId;
    }
    const serviceTags = await this.resolveServiceTagsFromSpa(body.spaId);
    const nextCoverImageUrl = this.cleanNullable(body.coverImageUrl);

    try {
      await this.db
        .update(schema.deals)
        .set({
          spaId: body.spaId,
          categoryId,
          serviceTags,
          titleVi: body.titleVi.trim(),
          titleEn: this.cleanNullable(body.titleEn),
          titleKo: this.cleanNullable(body.titleKo),
          shortDescriptionVi: this.cleanNullable(body.shortDescriptionVi),
          shortDescriptionEn: this.cleanNullable(body.shortDescriptionEn),
          shortDescriptionKo: this.cleanNullable(body.shortDescriptionKo),
          contentVi: this.cleanNullable(body.contentVi),
          contentEn: this.cleanNullable(body.contentEn),
          contentKo: this.cleanNullable(body.contentKo),
          coverImageUrl: nextCoverImageUrl,
          status: this.normalizeStatus(body.status),
          startAt: this.toDate(body.startAt),
          endAt: this.toDate(body.endAt),
          isSoldOut: body.isSoldOut ?? false,
          priorityScore: body.priorityScore ?? 0,
          currency: this.cleanNullable(body.currency) ?? 'VND',
          discountPercent: this.cleanNullable(body.discountPercent),
          discountedService: this.cleanNullable(body.discountedService),
          priceRange: this.cleanNullable(body.priceRange),
          source: existing.source ?? 'cms_admin',
          reportCount: body.reportCount ?? 0,
          updatedAt: new Date(),
        })
        .where(eq(schema.deals.id, id));

      await this.syncSlugs(id, body);
      await this.syncGeoFromSpa(id, body.spaId);
      if (existing.coverImageUrl && existing.coverImageUrl !== nextCoverImageUrl) {
        await this.dealCoverStorage.removeByUrl(existing.coverImageUrl);
      }
      return this.getById(id);
    } catch (e: any) {
      console.error('UPDATE_DEAL_ERROR:', e);
      throw new BadRequestException('Lỗi update: ' + e.message + ' | Detail: ' + (e.detail || e.routine || e.code || JSON.stringify(e)));
    }
  }

  async remove(id: number): Promise<{ success: true }> {
    const existing = await this.findDeal(id);
    await this.deleteChildren(id);
    await this.db.delete(schema.deals).where(eq(schema.deals.id, id));
    await this.dealCoverStorage.removeByUrl(existing.coverImageUrl);
    return { success: true };
  }

  async uploadCoverImage(file: { originalname: string; buffer: Buffer; mimetype?: string }) {
    const url = await this.dealCoverStorage.save(file);
    return {
      url,
      previewUrl: await this.photoCache.toDisplayUrl(url) ?? url,
    };
  }

  private async deleteChildren(dealId: number) {
    const variants = await this.db
      .select({ id: schema.dealVariants.id })
      .from(schema.dealVariants)
      .where(eq(schema.dealVariants.dealId, dealId));

    if (variants.length) {
      const variantIds = variants.map((variant) => variant.id);
      await this.db.delete(schema.dealTimeSlots).where(or(...variantIds.map((variantId) => eq(schema.dealTimeSlots.variantId, variantId))));
      await this.db.delete(schema.dealVariantPrices).where(or(...variantIds.map((variantId) => eq(schema.dealVariantPrices.variantId, variantId))));
    }

    await this.db.delete(schema.dealMedia).where(eq(schema.dealMedia.dealId, dealId));
    await this.db.delete(schema.dealVariants).where(eq(schema.dealVariants.dealId, dealId));
  }

  private async syncGeoFromSpa(dealId: number, spaId: string) {
    const [location] = await this.db
      .select({
        cityId: schema.spaLocations.cityId,
        districtId: schema.spaLocations.districtId,
        wardId: schema.spaLocations.wardId,
        placeId: schema.spaLocations.placeId,
      })
      .from(schema.spaLocations)
      .where(
        and(
          eq(schema.spaLocations.spaId, spaId),
          eq(schema.spaLocations.isPrimary, true),
        ),
      )
      .limit(1);

    await this.db.update(schema.deals)
      .set({
        cityId: location?.cityId ?? null,
        districtId: location?.districtId ?? null,
        wardId: location?.wardId ?? null,
        placeId: location?.placeId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.deals.id, dealId));
  }

  private async syncSlugs(id: number, body: UpsertAdminDealDto) {
    const slugVi = await this.ensureUniqueSlug('slugVi', buildLocalizedSlug({ locale: 'vi', text: body.titleVi, id }), id);
    const slugEn = await this.ensureUniqueSlug('slugEn', buildLocalizedSlug({
      locale: 'en',
      text: this.cleanNullable(body.titleEn) ?? body.titleVi,
      id,
    }), id);
    const slugKo = await this.ensureUniqueSlug('slugKo', buildLocalizedSlug({
      locale: 'ko',
      text: this.cleanNullable(body.titleKo) ?? body.titleVi,
      id,
    }), id);

    await this.db.update(schema.deals)
      .set({
        slugVi,
        slugEn,
        slugKo,
        updatedAt: new Date(),
      })
      .where(eq(schema.deals.id, id));
  }

  private async ensureUniqueSlug(
    column: 'slugVi' | 'slugEn' | 'slugKo',
    base: string,
    excludeId?: number,
  ): Promise<string> {
    let candidate = base;
    let index = 2;
    while (true) {
      const [row] = await this.db
        .select({ id: schema.deals.id })
        .from(schema.deals)
        .where(eq(schema.deals[column], candidate))
        .limit(1);
      if (!row || row.id === excludeId) return candidate;
      candidate = `${base}-${index}`;
      index += 1;
    }
  }

  private async findDeal(id: number) {
    const [deal] = await this.db
      .select()
      .from(schema.deals)
      .where(eq(schema.deals.id, id))
      .limit(1);
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }
    return deal;
  }

  private async assertSpaExists(spaId: string) {
    const [spa] = await this.db
      .select({ id: schema.spas.id })
      .from(schema.spas)
      .where(eq(schema.spas.id, spaId))
      .limit(1);
    if (!spa) {
      throw new BadRequestException('spaId does not exist');
    }
  }

  private async resolveCategoryIdFromSpa(spaId: string, allowEmpty = false): Promise<number | null> {
    const [service] = await this.db
      .select({ id: schema.services.id, categoryId: schema.services.categoryId })
      .from(schema.spaServices)
      .innerJoin(schema.services, eq(schema.services.id, schema.spaServices.serviceId))
      .where(eq(schema.spaServices.spaId, spaId))
      .orderBy(schema.services.sortOrder, schema.services.nameVi, schema.services.id)
      .limit(1);

    if (!service && !allowEmpty) {
      throw new BadRequestException('Selected spa must have at least one service');
    }

    return service?.categoryId ?? service?.id ?? null;
  }

  private async resolveServiceTagsFromSpa(spaId: string): Promise<string[]> {
    const services = await this.db
      .select({ nameVi: schema.services.nameVi })
      .from(schema.spaServices)
      .innerJoin(schema.services, eq(schema.services.id, schema.spaServices.serviceId))
      .where(and(eq(schema.spaServices.spaId, spaId), eq(schema.services.isActive, true)))
      .orderBy(schema.services.sortOrder, schema.services.nameVi);

    return services.map(s => s.nameVi).filter(Boolean) as string[];
  }

  private validateBody(body: UpsertAdminDealDto) {
    if (!body.titleVi?.trim()) {
      throw new BadRequestException('titleVi is required');
    }
    if (!body.titleEn?.trim()) {
      throw new BadRequestException('titleEn is required');
    }
    if (!body.titleKo?.trim()) {
      throw new BadRequestException('titleKo is required');
    }
    if (!body.spaId?.trim()) {
      throw new BadRequestException('spaId is required');
    }
    if (!body.contentVi?.trim()) {
      throw new BadRequestException('contentVi is required');
    }
    if (!body.contentEn?.trim()) {
      throw new BadRequestException('contentEn is required');
    }
    if (!body.contentKo?.trim()) {
      throw new BadRequestException('contentKo is required');
    }
  }

  private normalizeStatus(status: string | null | undefined): string {
    const s = this.cleanNullable(status);
    if (s === 'inactive') return 'expired';
    return s ?? 'draft';
  }

  private cleanNullable(value: string | null | undefined): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private toDate(value: string | null | undefined): Date | null {
    if (!value?.trim()) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getTime() - 7 * 60 * 60 * 1000);
  }

  private numberToDb(value: number | null | undefined): string | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    return String(value);
  }

  private toNumberOrNull(value: unknown): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }
}
