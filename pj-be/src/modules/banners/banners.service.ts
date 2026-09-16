import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';
import { PhotoCacheService } from '../../common/photo-cache/photo-cache.service';
import { BannerStorageService } from './banner-storage.service';
import type { BannerUploadFile } from './banner-file.type';
import { BannerListQueryDto, BannerLocale, BannerPlacement, BannerResponseDto, ReorderBannersDto, UpsertBannerDto } from './dto/banner.dto';

type BannerUploadFields = {
  imageVi?: BannerUploadFile[];
  imageEn?: BannerUploadFile[];
  imageKo?: BannerUploadFile[];
};

@Injectable()
export class BannersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly bannerStorage: BannerStorageService,
    private readonly photoCache: PhotoCacheService,
  ) { }

  async list(query: BannerListQueryDto = {}): Promise<BannerResponseDto[]> {
    const conditions = [];
    if (query.placement) conditions.push(eq(schema.banners.placement, query.placement));
    if (query.enabledOnly) conditions.push(eq(schema.banners.isEnabled, true));

    const rows = await this.db
      .select()
      .from(schema.banners)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(
        asc(schema.banners.displayOrder),
        asc(schema.banners.slotNumber),
        asc(schema.banners.id),
      );

    const locale = query.locale ?? 'vi';
    return Promise.all(rows.map((row) => this.mapBanner(row, locale)));
  }

  async create(body: UpsertBannerDto, files?: BannerUploadFields): Promise<BannerResponseDto> {
    this.validatePlacement(body.placement, body.slotNumber ?? null);

    if (!files?.imageVi?.[0]) {
      throw new BadRequestException('Vietnamese banner image file is required');
    }

    const imageVi = await this.bannerStorage.save(files.imageVi[0]);
    const imageEn = files.imageEn?.[0] ? await this.bannerStorage.save(files.imageEn[0]) : null;
    const imageKo = files.imageKo?.[0] ? await this.bannerStorage.save(files.imageKo[0]) : null;
    const nameVi = body.nameVi.trim();
    const nameEn = this.cleanNullable(body.nameEn);
    const nameKo = this.cleanNullable(body.nameKo);

    const [created] = await this.db
      .insert(schema.banners)
      .values({
        name: nameVi,
        nameVi,
        nameEn,
        nameKo,
        placement: body.placement,
        slotNumber: body.slotNumber ?? null,
        imageUrl: imageVi,
        imageUrlVi: imageVi,
        imageUrlEn: imageEn,
        imageUrlKo: imageKo,
        targetUrl: body.targetUrl.trim(),
        gaClickTag: this.cleanNullable(body.gaClickTag),
        spaId: body.spaId ?? null,
        isEnabled: body.isEnabled ?? true,
        displayOrder: body.displayOrder ?? 0,
      })
      .returning();

    return this.mapBanner(created, 'vi');
  }

  async update(id: number, body: UpsertBannerDto, files?: BannerUploadFields): Promise<BannerResponseDto> {
    this.validatePlacement(body.placement, body.slotNumber ?? null);

    const current = await this.findById(id);
    const nextImageVi = files?.imageVi?.[0] ? await this.bannerStorage.save(files.imageVi[0]) : (current.imageUrlVi ?? current.imageUrl);
    const nextImageEn = files?.imageEn?.[0] ? await this.bannerStorage.save(files.imageEn[0]) : (current.imageUrlEn ?? null);
    const nextImageKo = files?.imageKo?.[0] ? await this.bannerStorage.save(files.imageKo[0]) : (current.imageUrlKo ?? null);
    const nameVi = body.nameVi.trim();
    const nameEn = this.cleanNullable(body.nameEn);
    const nameKo = this.cleanNullable(body.nameKo);

    const [updated] = await this.db
      .update(schema.banners)
      .set({
        name: nameVi,
        nameVi,
        nameEn,
        nameKo,
        placement: body.placement,
        slotNumber: body.slotNumber ?? null,
        imageUrl: nextImageVi,
        imageUrlVi: nextImageVi,
        imageUrlEn: nextImageEn,
        imageUrlKo: nextImageKo,
        targetUrl: body.targetUrl.trim(),
        gaClickTag: this.cleanNullable(body.gaClickTag),
        spaId: body.spaId ?? null,
        isEnabled: body.isEnabled ?? true,
        displayOrder: body.displayOrder ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(schema.banners.id, id))
      .returning();

    await Promise.all([
      files?.imageVi?.[0] && current.imageUrlVi && current.imageUrlVi !== nextImageVi
        ? this.bannerStorage.removeByUrl(current.imageUrlVi)
        : Promise.resolve(),
      files?.imageEn?.[0] && current.imageUrlEn && current.imageUrlEn !== nextImageEn
        ? this.bannerStorage.removeByUrl(current.imageUrlEn)
        : Promise.resolve(),
      files?.imageKo?.[0] && current.imageUrlKo && current.imageUrlKo !== nextImageKo
        ? this.bannerStorage.removeByUrl(current.imageUrlKo)
        : Promise.resolve(),
    ]);

    return this.mapBanner(updated, 'vi');
  }

  async remove(id: number): Promise<{ success: true }> {
    const current = await this.findById(id);

    await this.db.delete(schema.banners).where(eq(schema.banners.id, id));
    await Promise.all([
      this.bannerStorage.removeByUrl(current.imageUrlVi ?? current.imageUrl),
      this.bannerStorage.removeByUrl(current.imageUrlEn),
      this.bannerStorage.removeByUrl(current.imageUrlKo),
    ]);

    return { success: true };
  }

  async reorder(body: ReorderBannersDto): Promise<{ success: true }> {
    const ids = body.items.map((item) => item.id);
    if (ids.length === 0) return { success: true };

    const rows = await this.db
      .select({ id: schema.banners.id })
      .from(schema.banners)
      .where(inArray(schema.banners.id, ids));

    if (rows.length !== ids.length) {
      throw new NotFoundException('One or more banners do not exist');
    }

    await Promise.all(body.items.map((item) =>
      this.db
        .update(schema.banners)
        .set({ displayOrder: item.displayOrder, updatedAt: new Date() })
        .where(eq(schema.banners.id, item.id)),
    ));

    return { success: true };
  }

  async publicList(placement?: BannerPlacement, locale: BannerLocale = 'vi', lat?: number, lng?: number): Promise<BannerResponseDto[]> {
    if (placement === 'home_slot') {
      let rows;
      if (lat != null && lng != null) {
        const result = await this.db.select({ banner: schema.banners })
          .from(schema.banners)
          .leftJoin(schema.spas, eq(schema.banners.spaId, schema.spas.id))
          .where(and(eq(schema.banners.placement, 'home_slot'), eq(schema.banners.isEnabled, true)))
          .orderBy(sql`
            CASE WHEN ${schema.spas.latitude} IS NULL OR ${schema.spas.longitude} IS NULL THEN 1 ELSE 0 END ASC,
            (6371 * acos(cos(radians(${lat})) * cos(radians(${schema.spas.latitude})) * cos(radians(${schema.spas.longitude}) - radians(${lng})) + sin(radians(${lat})) * sin(radians(${schema.spas.latitude})))) ASC,
            ${schema.banners.slotNumber} ASC NULLS LAST,
            ${schema.banners.displayOrder} DESC,
            ${schema.banners.id} ASC
          `)
          .limit(8);
        rows = result.map(r => r.banner);
      } else {
        rows = await this.db.select()
          .from(schema.banners)
          .where(and(eq(schema.banners.placement, 'home_slot'), eq(schema.banners.isEnabled, true)))
          .orderBy(
            sql`${schema.banners.slotNumber} ASC NULLS LAST`,
            desc(schema.banners.displayOrder),
            asc(schema.banners.id)
          )
          .limit(8);
      }
      return Promise.all(rows.map(row => this.mapBanner(row, locale)));
    }

    const result = await this.list({
      placement,
      enabledOnly: true,
      locale,
    });

    if (placement === 'breadcrumb') {
      return result.slice(0, 1);
    }

    return result;
  }

  private async findById(id: number) {
    const [row] = await this.db
      .select()
      .from(schema.banners)
      .where(eq(schema.banners.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Banner not found');
    }

    return row;
  }

  private validatePlacement(placement: BannerPlacement, slotNumber: number | null): void {
    if (placement === 'home_slot' && (slotNumber == null || slotNumber < 1 || slotNumber > 8)) {
      throw new BadRequestException('home_slot banners require slotNumber between 1 and 8');
    }

    if (placement === 'breadcrumb' && slotNumber != null) {
      throw new BadRequestException('breadcrumb banners must not define slotNumber');
    }
  }

  private cleanNullable(value: string | null | undefined): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private pickLocalizedText(
    row: typeof schema.banners.$inferSelect,
    locale: BannerLocale,
  ): string {
    if (locale === 'en') return this.cleanNullable(row.nameEn) ?? this.cleanNullable(row.nameVi) ?? row.name;
    if (locale === 'ko') return this.cleanNullable(row.nameKo) ?? this.cleanNullable(row.nameVi) ?? row.name;
    return this.cleanNullable(row.nameVi) ?? row.name;
  }

  private pickLocalizedImageUrl(
    row: typeof schema.banners.$inferSelect,
    locale: BannerLocale,
  ): string {
    if (locale === 'en') return row.imageUrlEn ?? row.imageUrlVi ?? row.imageUrl;
    if (locale === 'ko') return row.imageUrlKo ?? row.imageUrlVi ?? row.imageUrl;
    return row.imageUrlVi ?? row.imageUrl;
  }

  private async mapBanner(
    row: typeof schema.banners.$inferSelect,
    locale: BannerLocale,
  ): Promise<BannerResponseDto> {
    const imageUrlVi = await this.photoCache.toDisplayUrl(row.imageUrlVi ?? row.imageUrl);
    const imageUrlEn = row.imageUrlEn ? await this.photoCache.toDisplayUrl(row.imageUrlEn) : null;
    const imageUrlKo = row.imageUrlKo ? await this.photoCache.toDisplayUrl(row.imageUrlKo) : null;
    const displayImageUrl = await this.photoCache.toDisplayUrl(this.pickLocalizedImageUrl(row, locale));
    const nameVi = this.cleanNullable(row.nameVi) ?? row.name;

    return {
      id: row.id,
      name: this.pickLocalizedText(row, locale),
      nameVi,
      nameEn: this.cleanNullable(row.nameEn),
      nameKo: this.cleanNullable(row.nameKo),
      placement: row.placement as BannerPlacement,
      slotNumber: row.slotNumber ?? null,
      spaId: row.spaId ?? null,
      imageUrl: displayImageUrl ?? row.imageUrl,
      imageUrlVi: imageUrlVi ?? row.imageUrlVi ?? row.imageUrl,
      imageUrlEn: imageUrlEn ?? null,
      imageUrlKo: imageUrlKo ?? null,
      targetUrl: row.targetUrl,
      gaClickTag: row.gaClickTag ?? null,
      isEnabled: row.isEnabled,
      displayOrder: row.displayOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
