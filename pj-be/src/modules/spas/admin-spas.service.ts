import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { randomUUID } from 'node:crypto';
import { buildPaginationMeta, PaginationMeta } from '../../common/dto/pagination.dto';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';
import { buildLocalizedSlug } from '../../common/utils/deal-localization.util';
import { AdminSpaDetailDto, AdminSpaListQueryDto, AdminSpaSummaryDto, UpsertAdminSpaDto } from './dto/admin-spa.dto';
import { ServiceResponseDto } from '../services/dto/service-response.dto';
import { SpaAvatarStorageService } from './spa-avatar-storage.service';
import { SpaGalleryStorageService } from './spa-gallery-storage.service';
import { PhotoCacheService } from '../../common/photo-cache/photo-cache.service';

@Injectable()
export class AdminSpasService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly spaAvatarStorage: SpaAvatarStorageService,
    private readonly spaGalleryStorage: SpaGalleryStorageService,
    private readonly photoCache: PhotoCacheService,
  ) { }

  async list(query: AdminSpaListQueryDto = new AdminSpaListQueryDto()): Promise<{ data: AdminSpaSummaryDto[]; meta: PaginationMeta }> {
    const conditions = [];
    if (query.q?.trim()) {
      const term = `%${query.q.trim()}%`;
      conditions.push(or(
        ilike(schema.spas.name, term),
        ilike(schema.spas.slug, term),
        ilike(schema.spas.phone, term),
        ilike(schema.spas.website, term),
      ));
    }

    const rows = await this.db
      .select({
        id: schema.spas.id,
        slug: schema.spas.slug,
        name: schema.spas.name,
        phone: schema.spas.phone,
        website: schema.spas.website,
        updatedAt: schema.spas.updatedAt,
        cityName: schema.cities.nameVi,
        districtName: schema.districts.nameVi,
        dealCount: count(schema.deals.id),
      })
      .from(schema.spas)
      .leftJoin(
        schema.spaLocations,
        and(
          eq(schema.spaLocations.spaId, schema.spas.id),
          eq(schema.spaLocations.isPrimary, true),
        ),
      )
      .leftJoin(schema.cities, eq(schema.cities.id, schema.spaLocations.cityId))
      .leftJoin(schema.districts, eq(schema.districts.id, schema.spaLocations.districtId))
      .leftJoin(schema.deals, eq(schema.deals.spaId, schema.spas.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(
        schema.spas.id,
        schema.spas.slug,
        schema.spas.name,
        schema.spas.phone,
        schema.spas.website,
        schema.spas.createdAt,
        schema.spas.updatedAt,
        schema.cities.nameVi,
        schema.districts.nameVi,
      )
      .orderBy(desc(schema.spas.updatedAt), desc(schema.spas.createdAt));

    const items = rows.map((row) => ({
      id: row.id,
      slug: row.slug ?? row.id,
      name: row.name ?? '',
      phone: row.phone ?? null,
      website: row.website ?? null,
      cityName: row.cityName ?? null,
      districtName: row.districtName ?? null,
      dealCount: Number(row.dealCount ?? 0),
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

  async getById(id: string): Promise<AdminSpaDetailDto> {
    const spa = await this.findSpa(id);

    const [location] = await this.db
      .select({
        cityId: schema.spaLocations.cityId,
        districtId: schema.spaLocations.districtId,
        wardId: schema.spaLocations.wardId,
        placeId: schema.spaLocations.placeId,
        addressLine: schema.spaLocations.addressLine,
        lat: schema.spaLocations.lat,
        lng: schema.spaLocations.lng,
        citySlug: schema.cities.slug,
        cityName: schema.cities.nameVi,
        districtSlug: schema.districts.slug,
        districtName: schema.districts.nameVi,
        placeSlug: schema.places.slug,
        placeName: schema.places.nameVi,
      })
      .from(schema.spaLocations)
      .leftJoin(schema.cities, eq(schema.cities.id, schema.spaLocations.cityId))
      .leftJoin(schema.districts, eq(schema.districts.id, schema.spaLocations.districtId))
      .leftJoin(schema.places, eq(schema.places.id, schema.spaLocations.placeId))
      .where(
        and(
          eq(schema.spaLocations.spaId, id),
          eq(schema.spaLocations.isPrimary, true),
        ),
      )
      .limit(1);

    const galleries = await this.db
      .select()
      .from(schema.spaGalleries)
      .where(eq(schema.spaGalleries.spaId, id))
      .orderBy(schema.spaGalleries.sortOrder, schema.spaGalleries.id);

    const services = await this.getSpaServices(id);
    const spaAvatarPreviewUrl = await this.photoCache.toDisplayUrl(spa.spaAvatar);
    const galleryPreviewUrls = await Promise.all(galleries.map((item) => this.photoCache.toDisplayUrl(item.imageUrl)));

    return {
      id: spa.id,
      slug: spa.slug ?? spa.id,
      slugVi: spa.slug ?? spa.id,
      slugEn: spa.slug ?? spa.id,
      slugKo: spa.slug ?? spa.id,
      name: spa.name ?? '',
      nameVi: spa.name ?? null,
      nameEn: null,
      nameKo: null,
      address: spa.address ?? null,
      phone: spa.phone ?? null,
      website: spa.website ?? null,
      description: spa.description ?? null,
      descriptionVi: spa.description ?? null,
      descriptionEn: null,
      descriptionKo: null,
      province: spa.province ?? null,
      googlePlaceId: spa.googlePlaceId ?? null,
      googleMapsUri: spa.googleMapsUri ?? null,
      latitude: this.toNumberOrNull(spa.latitude),
      longitude: this.toNumberOrNull(spa.longitude),
      ratingValue: this.toNumberOrNull(spa.ratingValue),
      reviewCount: spa.reviewCount ?? null,
      messagingLinkZalo: spa.messagingLinkZalo ?? null,
      messagingLinkWhatsapp: spa.messagingLinkWhatsapp ?? null,
      messagingLinkTelegram: spa.messagingLinkTelegram ?? null,
      messagingLinkMessenger: spa.messagingLinkMessenger ?? null,
      messagingLinkKakaotalk: spa.messagingLinkKakaotalk ?? null,
      facebookLink: spa.facebookLink ?? null,
      instagramLink: spa.instagramLink ?? null,
      twitterLink: spa.twitterLink ?? null,
      serviceIds: services.map((service) => service.id),
      services,
      openingHours: this.jsonOrNull(spa.openingHours),
      reviews: Array.isArray(spa.reviews) ? spa.reviews as Record<string, unknown>[] : null,
      photos: Array.isArray(spa.photos) ? spa.photos as Record<string, unknown>[] : null,
      spaAvatar: spa.spaAvatar ?? null,
      spaAvatarPreviewUrl: spaAvatarPreviewUrl ?? spa.spaAvatar ?? null,
      location: location ? {
        cityId: location.cityId ?? null,
        districtId: location.districtId ?? null,
        wardId: location.wardId ?? null,
        placeId: location.placeId ?? null,
        addressLine: location.addressLine ?? null,
        lat: this.toNumberOrNull(location.lat),
        lng: this.toNumberOrNull(location.lng),
        citySlug: location.citySlug ?? null,
        cityName: location.cityName ?? null,
        districtSlug: location.districtSlug ?? null,
        districtName: location.districtName ?? null,
        placeSlug: location.placeSlug ?? null,
        placeName: location.placeName ?? null,
      } : null,
      galleries: galleries.map((item, index) => ({
        imageUrl: item.imageUrl ?? '',
        previewUrl: galleryPreviewUrls[index] ?? item.imageUrl ?? '',
        sortOrder: item.sortOrder ?? 0,
      })),
      createdAt: spa.createdAt ?? null,
      updatedAt: spa.updatedAt ?? null,
    };
  }

  async create(body: UpsertAdminSpaDto): Promise<AdminSpaDetailDto> {
    this.validateBody(body);
    const now = new Date();
    const spaId = randomUUID();

    const [created] = await this.db
      .insert(schema.spas)
      .values({
        id: spaId,
        name: body.name.trim(),
        address: this.cleanNullable(body.address),
        phone: this.cleanNullable(body.phone),
        website: this.cleanNullable(body.website),
        description: this.cleanNullable(body.description),
        province: this.cleanNullable(body.province),
        googlePlaceId: this.cleanNullable(body.googlePlaceId),
        googleMapsUri: this.cleanNullable(body.googleMapsUri),
        latitude: this.numberToDb(body.latitude),
        longitude: this.numberToDb(body.longitude),
        ratingValue: this.numberToDb(body.ratingValue),
        reviewCount: body.reviewCount ?? null,
        messagingLinkZalo: this.cleanNullable(body.messagingLinkZalo),
        messagingLinkWhatsapp: this.cleanNullable(body.messagingLinkWhatsapp),
        messagingLinkTelegram: this.cleanNullable(body.messagingLinkTelegram),
        messagingLinkMessenger: this.cleanNullable(body.messagingLinkMessenger),
        messagingLinkKakaotalk: this.cleanNullable(body.messagingLinkKakaotalk),
        facebookLink: this.cleanNullable(body.facebookLink),
        instagramLink: this.cleanNullable(body.instagramLink),
        twitterLink: this.cleanNullable(body.twitterLink),
        openingHours: body.openingHours ?? null,
        ...(body.reviews !== undefined ? { reviews: body.reviews ?? null } : {}),
        ...(body.photos !== undefined ? { photos: body.photos ?? null } : {}),
        spaAvatar: this.cleanNullable(body.spaAvatar),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await this.syncSlugs(created.id, body);
    await this.replaceLocationAndGalleries(created.id, body);
    await this.replaceSpaServices(created.id, body.serviceIds ?? []);
    return this.getById(created.id);
  }

  async update(id: string, body: UpsertAdminSpaDto): Promise<AdminSpaDetailDto> {
    const existing = await this.findSpa(id);
    this.validateBody(body);
    const nextSpaAvatar = this.cleanNullable(body.spaAvatar);

    await this.db
      .update(schema.spas)
      .set({
        name: body.name.trim(),
        address: this.cleanNullable(body.address),
        phone: this.cleanNullable(body.phone),
        website: this.cleanNullable(body.website),
        description: this.cleanNullable(body.description),
        province: this.cleanNullable(body.province),
        googlePlaceId: this.cleanNullable(body.googlePlaceId),
        googleMapsUri: this.cleanNullable(body.googleMapsUri),
        latitude: this.numberToDb(body.latitude),
        longitude: this.numberToDb(body.longitude),
        ratingValue: this.numberToDb(body.ratingValue),
        reviewCount: body.reviewCount ?? null,
        messagingLinkZalo: this.cleanNullable(body.messagingLinkZalo),
        messagingLinkWhatsapp: this.cleanNullable(body.messagingLinkWhatsapp),
        messagingLinkTelegram: this.cleanNullable(body.messagingLinkTelegram),
        messagingLinkMessenger: this.cleanNullable(body.messagingLinkMessenger),
        messagingLinkKakaotalk: this.cleanNullable(body.messagingLinkKakaotalk),
        facebookLink: this.cleanNullable(body.facebookLink),
        instagramLink: this.cleanNullable(body.instagramLink),
        twitterLink: this.cleanNullable(body.twitterLink),
        openingHours: body.openingHours ?? null,
        ...(body.reviews !== undefined ? { reviews: body.reviews ?? null } : {}),
        ...(body.photos !== undefined ? { photos: body.photos ?? null } : {}),
        spaAvatar: nextSpaAvatar,
        updatedAt: new Date(),
      })
      .where(eq(schema.spas.id, id));

    await this.syncSlugs(id, body);
    await this.replaceLocationAndGalleries(id, body);
    await this.replaceSpaServices(id, body.serviceIds ?? []);
    if (existing.spaAvatar && existing.spaAvatar !== nextSpaAvatar) {
      await this.spaAvatarStorage.removeByUrl(existing.spaAvatar);
    }
    return this.getById(id);
  }

  async remove(id: string): Promise<{ success: true }> {
    const existingSpa = await this.findSpa(id);

    const dealRows = await this.db
      .select({ id: schema.deals.id })
      .from(schema.deals)
      .where(eq(schema.deals.spaId, id));
    const dealIds = dealRows.map((row) => row.id);

    if (dealIds.length) {
      const variantRows = await this.db
        .select({ id: schema.dealVariants.id })
        .from(schema.dealVariants)
        .where(inArray(schema.dealVariants.dealId, dealIds));
      const variantIds = variantRows.map((row) => row.id);

      if (variantIds.length) {
        await this.db.delete(schema.dealTimeSlots).where(inArray(schema.dealTimeSlots.variantId, variantIds));
        await this.db.delete(schema.dealVariantPrices).where(inArray(schema.dealVariantPrices.variantId, variantIds));
      }
      await this.db.delete(schema.dealMedia).where(inArray(schema.dealMedia.dealId, dealIds));
      await this.db.delete(schema.dealVariants).where(inArray(schema.dealVariants.dealId, dealIds));
      await this.db.delete(schema.deals).where(inArray(schema.deals.id, dealIds));
    }

    await this.db.delete(schema.spaExternalReviews).where(eq(schema.spaExternalReviews.spaId, id));
    await this.db.delete(schema.spaServices).where(eq(schema.spaServices.spaId, id));
    const existingGalleryRows = await this.db
      .select({ imageUrl: schema.spaGalleries.imageUrl })
      .from(schema.spaGalleries)
      .where(eq(schema.spaGalleries.spaId, id));
    await this.db.delete(schema.spaGalleries).where(eq(schema.spaGalleries.spaId, id));
    await this.db.delete(schema.spaLocations).where(eq(schema.spaLocations.spaId, id));
    await this.db.delete(schema.spas).where(eq(schema.spas.id, id));
    await Promise.all(existingGalleryRows.map((row) => this.spaGalleryStorage.removeByUrl(row.imageUrl)));
    await this.spaAvatarStorage.removeByUrl(existingSpa.spaAvatar);
    return { success: true };
  }

  async uploadGalleryImage(file: { originalname: string; buffer: Buffer; mimetype?: string }) {
    const url = await this.spaGalleryStorage.save(file);
    return {
      url,
      previewUrl: await this.photoCache.toDisplayUrl(url) ?? url,
    };
  }

  async uploadAvatarImage(file: { originalname: string; buffer: Buffer; mimetype?: string }) {
    const url = await this.spaAvatarStorage.save(file);
    return {
      url,
      previewUrl: await this.photoCache.toDisplayUrl(url) ?? url,
    };
  }

  private async replaceLocationAndGalleries(spaId: string, body: UpsertAdminSpaDto) {
    await this.db.delete(schema.spaLocations).where(eq(schema.spaLocations.spaId, spaId));

    if (body.location) {
      await this.db.insert(schema.spaLocations).values({
        id: sql`default`,
        spaId,
        cityId: body.location.cityId ?? null,
        districtId: body.location.districtId ?? null,
        wardId: body.location.wardId ?? null,
        placeId: body.location.placeId ?? null,
        addressLine: this.cleanNullable(body.location.addressLine),
        lat: this.numberToDb(body.location.lat),
        lng: this.numberToDb(body.location.lng),
        isPrimary: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const existingGalleries = await this.db
      .select({ imageUrl: schema.spaGalleries.imageUrl })
      .from(schema.spaGalleries)
      .where(eq(schema.spaGalleries.spaId, spaId));

    await this.db.delete(schema.spaGalleries).where(eq(schema.spaGalleries.spaId, spaId));
    const galleries = (body.galleries ?? []).filter((item) => item.imageUrl.trim().length > 0);
    if (galleries.length) {
      await this.db.insert(schema.spaGalleries).values(
        galleries.map((item, index) => ({
          id: sql`default`,
          spaId,
          imageUrl: item.imageUrl.trim(),
          sortOrder: item.sortOrder ?? index,
          createdAt: new Date(),
        })),
      );
    }

    const keptUrls = new Set(galleries.map((item) => item.imageUrl.trim()));
    await Promise.all(
      existingGalleries
        .map((row) => row.imageUrl)
        .filter((imageUrl): imageUrl is string => Boolean(imageUrl && !keptUrls.has(imageUrl)))
        .map((imageUrl) => this.spaGalleryStorage.removeByUrl(imageUrl)),
    );
  }

  private async replaceSpaServices(spaId: string, serviceIds: number[]) {
    await this.db.delete(schema.spaServices).where(eq(schema.spaServices.spaId, spaId));

    const uniqueServiceIds = [...new Set(serviceIds.filter((id) => Number.isFinite(id)))];
    if (uniqueServiceIds.length > 0) {
      await this.db.insert(schema.spaServices).values(
        uniqueServiceIds.map((serviceId) => ({
          spaId,
          serviceId,
        })),
      );
    }

    const categoryId = await this.resolveCategoryIdFromSpa(spaId);
    const serviceTags = await this.resolveServiceTagsFromSpa(spaId);

    if (categoryId || serviceTags.length > 0) {
      await this.db.update(schema.deals).set({
        categoryId,
        serviceTags,
        updatedAt: new Date(),
      }).where(eq(schema.deals.spaId, spaId));
    } else {
      await this.db.update(schema.deals).set({
        categoryId: null,
        serviceTags: [],
        updatedAt: new Date(),
      }).where(eq(schema.deals.spaId, spaId));
    }
  }

  private async resolveCategoryIdFromSpa(spaId: string): Promise<number | null> {
    const [service] = await this.db
      .select({ id: schema.services.id, categoryId: schema.services.categoryId })
      .from(schema.spaServices)
      .innerJoin(schema.services, eq(schema.services.id, schema.spaServices.serviceId))
      .where(eq(schema.spaServices.spaId, spaId))
      .orderBy(schema.services.sortOrder, schema.services.nameVi, schema.services.id)
      .limit(1);

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

  private async getSpaServices(spaId: string): Promise<ServiceResponseDto[]> {
    const rows = await this.db
      .select({
        id: schema.services.id,
        code: schema.services.code,
        nameVi: schema.services.nameVi,
        nameEn: schema.services.nameEn,
        nameKo: schema.services.nameKo,
        slugVi: schema.services.slugVi,
        slugEn: schema.services.slugEn,
        slugKo: schema.services.slugKo,
        slugGlobal: schema.services.slugGlobal,
        sortOrder: schema.services.sortOrder,
        categoryId: schema.services.categoryId,
      })
      .from(schema.spaServices)
      .innerJoin(schema.services, eq(schema.services.id, schema.spaServices.serviceId))
      .where(eq(schema.spaServices.spaId, spaId))
      .orderBy(schema.services.sortOrder, schema.services.nameVi);

    return rows.map((row) => ({
      id: row.id,
      code: row.code ?? '',
      nameVi: row.nameVi ?? '',
      nameEn: row.nameEn ?? null,
      nameKo: row.nameKo ?? null,
      slugVi: row.slugVi ?? null,
      slugEn: row.slugEn ?? null,
      slugKo: row.slugKo ?? null,
      slugGlobal: row.slugGlobal ?? '',
      sortOrder: row.sortOrder ?? 0,
      categoryId: row.categoryId ?? null,
      targetUrl: null,
    }));
  }

  private async syncSlugs(id: string, body: UpsertAdminSpaDto) {
    const name = this.cleanNullable(body.nameVi) ?? body.name.trim();
    const canonicalSlug = await this.ensureUniqueSlug(buildLocalizedSlug({ locale: 'vi', text: name }), id);

    await this.db.update(schema.spas)
      .set({
        slug: canonicalSlug,
        updatedAt: new Date(),
      })
      .where(eq(schema.spas.id, id));
  }

  private async ensureUniqueSlug(
    base: string,
    excludeId?: string,
  ): Promise<string> {
    let candidate = base;
    let index = 2;
    while (true) {
      const [row] = await this.db
        .select({ id: schema.spas.id })
        .from(schema.spas)
        .where(eq(schema.spas.slug, candidate))
        .limit(1);
      if (!row || row.id === excludeId) return candidate;
      candidate = `${base}-${index}`;
      index += 1;
    }
  }

  private async findSpa(id: string) {
    const [spa] = await this.db
      .select({
        id: schema.spas.id,
        numId: schema.spas.numId,
        name: schema.spas.name,
        slug: schema.spas.slug,
        address: schema.spas.address,
        phone: schema.spas.phone,
        website: schema.spas.website,
        description: schema.spas.description,
        province: schema.spas.province,
        googlePlaceId: schema.spas.googlePlaceId,
        googleMapsUri: schema.spas.googleMapsUri,
        latitude: schema.spas.latitude,
        longitude: schema.spas.longitude,
        ratingValue: schema.spas.ratingValue,
        reviewCount: schema.spas.reviewCount,
        messagingLinkZalo: schema.spas.messagingLinkZalo,
        messagingLinkWhatsapp: schema.spas.messagingLinkWhatsapp,
        messagingLinkTelegram: schema.spas.messagingLinkTelegram,
        messagingLinkMessenger: schema.spas.messagingLinkMessenger,
        messagingLinkKakaotalk: schema.spas.messagingLinkKakaotalk,
        facebookLink: schema.spas.facebookLink,
        instagramLink: schema.spas.instagramLink,
        twitterLink: schema.spas.twitterLink,
        openingHours: schema.spas.openingHours,
        photos: schema.spas.photos,
        reviews: schema.spas.reviews,
        spaAvatar: schema.spas.spaAvatar,
        amenities: schema.spas.amenities,
        createdAt: schema.spas.createdAt,
        updatedAt: schema.spas.updatedAt,
      })
      .from(schema.spas)
      .where(eq(schema.spas.id, id))
      .limit(1);

    if (!spa) {
      throw new NotFoundException('Spa not found');
    }

    return spa;
  }

  private validateBody(body: UpsertAdminSpaDto) {
    if (!body.name?.trim()) {
      throw new BadRequestException('name is required');
    }
  }

  private cleanNullable(value: string | null | undefined): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
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

  private jsonOrNull(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  }
}
