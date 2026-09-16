import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, gte, inArray, lte, ne, sql, type SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';
import { buildPaginationMeta, PaginationMeta } from '../../common/dto/pagination.dto';
import { canonicalDealSlug } from '../../common/utils/canonical-deal-slug.util';
import {
  buildTimeRangeLabel,
  parseTimeRangeFromText,
  pickDealDisplayTitle,
  pickLocalizedText,
  stripVietnameseAccents,
} from '../../common/utils/deal-localization.util';
import { dealWithinPublicationWindow } from '../../common/utils/deal-publication-window.util';
import { isSpaOpenNow } from '../../common/utils/opening-hours.util';
import { extractFirstCachedPhotoUrl, haversineKm, parseDiscountPercent } from '../../common/utils/geo.util';
import { PhotoCacheService } from '../../common/photo-cache/photo-cache.service';
import {
  FLASH_APPLICABLE_MAX_MINUTES,
  FLASH_APPLICABLE_MIN_MINUTES,
  FLASH_HOME_TOP_SPAS,
  formatWindowLabel,
  nowInWallClockWindow,
  padTimeOfDay,
  slotWallClockDurationMinutes,
  slotWindowBoundsLocal,
} from './flash-sale-window.util';
import { TrackingService } from '../tracking/tracking.service';
import { parseOpeningHours } from '../spas/spas.service';
import { DealLocale, DealsQueryDto, DealSortOrder } from './dto/deals-query.dto';
import { buildDealScheduleFields } from '../../common/utils/deal-schedule.util';
import { DealCardDto, SpaBasicDto, SpaDealsGroupDto, SpaDetailForDealDto } from './dto/deal-card.dto';
import { DealBreadcrumbItemDto, DealDetailDto } from './dto/deal-detail.dto';
import { FlashSaleDto } from './dto/flash-sale.dto';
import { SPA_EXTRA_ATTRS } from '../../common/constants/extra-filters';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RawDealRow {
  id: number;
  slugVi: string | null;
  slugEn: string | null;
  slugKo: string | null;
  titleVi: string | null;
  titleEn: string | null;
  titleKo: string | null;
  coverImageUrl: string | null;
  discountPercent: string | null;
  currency: string | null;
  startAt: Date | null;
  endAt: Date | null;
  spaId: string | null;
  cityId: number | null;
  districtId: number | null;
  salePrice: string | null;
  originalPrice: string | null;
  spaSlug: string | null;
  spaName: string | null;
  spaRating: string | null;
  spaReviewCount: number | null;
  spaPhotos: unknown;
  spaAvatar: string | null;
  spaLat: string | null;
  spaLng: string | null;
  googlePlaceId: string | null;
  cityName: string | null;
  cityNameEn: string | null;
  cityNameKo: string | null;
  serviceNameVi: string | null;
  serviceNameEn: string | null;
  serviceNameKo: string | null;
  spaOpeningHours: unknown;
}

interface SpaGroupInternal {
  spa: SpaBasicDto;
  deals: DealCardDto[];
  minSalePrice: number | null;
  maxSalePrice: number | null;
  maxDiscountPercent: number | null;
  openingHoursRaw?: unknown;
}

interface ResolvedLocationIds {
  cityId?: number;
  districtId?: number;
  wardId?: number;
  placeId?: number;
  cityNameVi?: string;
  placeLat?: number;
  placeLng?: number;
}

/** Kết quả `resolveFlashSaleWindow` — có thể share giữa `getDeals` + `getFlashSale` trong một request. */
export interface FlashSaleWindowState {
  mode: 'none' | 'slot' | 'timestamp';
  variantIds: number[];
  dealIds: number[];
  windowStartsAt: Date | null;
  windowEndsAt: Date | null;
  windowLabel: string | null;
  applicableDurationMinutes: number | null;
}

/** Trang SEO `node_type = place`: lọc spa trong bán kính này (km) quanh tọa độ trung tâm của place. */
export const PLACE_SEO_HUB_RADIUS_KM = 20;

export interface GetDealsCallOptions {
  flashSaleWindow?: FlashSaleWindowState;
  /** Tâm place + bán kính — lọc theo khoảng cách tới spa (spa_locations hoặc tọa độ chính của spa). */
  placeHubGeo?: { lat: number; lng: number; radiusKm: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickLocalizedDealText(
  locale: DealLocale | undefined,
  vi: string | null | undefined,
  en: string | null | undefined,
  ko: string | null | undefined,
): string | null {
  const viText = vi?.trim() || '';
  const enText = en?.trim() || '';
  const koText = ko?.trim() || '';

  if (locale === 'en') {
    if (enText) return enText;
    return viText ? stripVietnameseAccents(viText) : null;
  }
  if (locale === 'ko') {
    if (koText) return koText;
    if (enText) return enText;
    return viText ? stripVietnameseAccents(viText) : null;
  }
  if (viText) return viText;
  if (enText) return enText;
  if (koText) return koText;
  return null;
}

/**
 * Ánh xạ danh mục cha sang các slug/tag của dịch vụ con (Parent-Child Service Mapping).
 * Đảm bảo khi vào hub cha (vd: /massage-spa), hệ thống lấy đủ deal gắn tag dịch vụ con.
 */
function expandServiceSlugToTerms(serviceSlug: string, serviceCode?: string): string[] {
  const norm = serviceSlug ? serviceSlug.trim().toLowerCase() : '';
  const childrenMap: Record<string, string[]> = {
    'massage-spa': [
      'massage-spa', 'massage_spa', 'massage spa',
      'massage', 'body-massage', 'foot-massage', 'body massage', 'foot massage', 'thái', 'thai', 'cổ truyền', 'hot stone', 'đá nóng', 'aroma',
      'head-spa', 'head_spa', 'head spa', 'goi-dau-duong-sinh', 'gội đầu dưỡng sinh', 'goi dau',
      'ear-spa', 'ear_spa', 'ear spa', 'ray-tai', 'lấy ráy tai', 'lay ray tai', 'ear cleaning',
      'skincare', 'skin care', 'skin_care', 'cham-soc-da', 'chăm sóc da', 'facial',
      'xong-hoi-sauna', 'sauna', 'xông hơi', 'xong hoi',
    ],
    'beauty-hair': [
      'beauty-hair', 'beauty_hair', 'beauty hair', 'lam-dep', 'làm đẹp',
      'nail', 'nails', 'lam-mong', 'làm móng', 'mani', 'pedi', 'mani/pedi',
      'lashes-brows', 'lashes_brows', 'lashes brows', 'long-mi', 'long-may', 'nối mi', 'noi mi', 'lashes', 'brows',
      'hair', 'lam-toc', 'làm tóc', 'cắt tóc', 'barber',
      'wax', 'waxing', 'tay-long', 'tẩy lông',
      'trang-diem', 'trang điểm', 'makeup',
    ],
    'food-drink': [
      'food-drink', 'food_drink', 'food drink', 'an-uong', 'ăn uống',
      'mon-viet', 'món việt', 'street food', 'street-food',
      'restaurant', 'nha-hang', 'nhà hàng', 'fine dining', 'chay', 'vegan', 'halal',
      'cafe', 'ca-phe', 'cà phê', 'coffee',
      'bar', 'pub', 'beer', 'buffet',
    ],
    tours: [
      'tours', 'tour', 'trai-nghiem', 'trải nghiệm', 'experience', 'activity',
      'city tour', 'city-tour', 'food tour', 'food-tour',
      'day trip', 'day-trip',
      'cooking class', 'cooking-class', 'lớp nấu ăn',
      've-tham-quan', 'vé tham quan', 'attraction', 'ticket',
      'golf', 'san-golf', 'sân golf',
      'hoat-dong-ngoai-troi', 'hoạt động ngoài trời', 'outdoor',
    ],
    transport: [
      'transport', 'di-chuyen', 'di chuyển',
      'san-bay', 'sân bay', 'airport transfer', 'airport-transfer', 'sân bay transfer',
      'thue-xe', 'thuê xe', 'thue-xe-may', 'thuê xe máy', 'thue-xe-o-to', 'thuê xe ô tô', 'car rental', 'motorbike rental',
      'xe-co-tai-xe', 'xe có tài xế', 'private driver',
      'limousine', 'bus', 'liên tỉnh', 'lien tinh',
      've-tau', 'vé tàu', 'train', 'train ticket',
    ],
    stay: [
      'stay', 'luu-tru', 'lưu trú',
      'khach-san', 'khách sạn', 'hotel',
      'resort', 'hotel-resort', 'hotel_resort',
      'homestay', 'villa',
      'can-ho-dai-ngay', 'căn hộ dài ngày', 'can ho', 'căn hộ', 'serviced apartment', 'long stay',
    ],
    health: [
      'health', 'suc-khoe', 'sức khỏe', 'medical', 'y-te', 'y tế',
      'hieu-thuoc', 'hiệu thuốc', 'hiệu thuốc 24h', 'pharmacy', 'nhà thuốc', '24h',
      'phong-kham', 'phòng khám', 'phòng khám quốc tế', 'clinic', 'international clinic',
      'nha-khoa', 'nha khoa', 'dental', 'răng', 'rang',
      'cap-cuu', 'cấp cứu', 'emergency', 'tri-lieu', 'trị liệu',
    ],
    essentials: [
      'essentials', 'tien-ich-du-lich', 'tiện ích du lịch', 'tien ich', 'tiện ích',
      'esim', 'sim', 'wifi', '4g', '5g',
      'doi-tien', 'đổi tiền', 'money exchange', 'currency exchange', 'atm',
      'giat-la', 'giặt là', 'giat-ui', 'giặt ủi', 'laundry',
      'gui-hanh-ly', 'gửi hành lý', 'luggage storage', 'luggage', 'baggage',
      'may-do', 'may đo', 'tailor', 'tailoring',
      'coworking', 'co-working', 'phong-cho', 'phòng chờ', 'lounge',
    ],
  };

  const childSlugs = norm ? (childrenMap[norm] || [norm]) : [];
  const terms = new Set<string>();
  for (const s of childSlugs) {
    const clean = s.trim().toLowerCase();
    if (clean) {
      terms.add(clean);
      terms.add(clean.replace(/-/g, ' '));
      terms.add(clean.replace(/-/g, '_'));
      terms.add(clean.replace(/\s+/g, '-'));
    }
  }

  if (serviceCode) {
    const codeLower = serviceCode.trim().toLowerCase();
    terms.add(codeLower);
    terms.add(serviceCode.trim());
    terms.add(codeLower.replace(/_/g, '-'));
    terms.add(codeLower.replace(/_/g, ' '));
  }

  return [...terms];
}

/**
 * Khi DB chưa có `deals.category_id`, lọc slug/tag chặt không khớp — dùng LIKE trên title/mô tả/tag.
 * Gợi ý theo `services.slug_global` (chuẩn hóa lower).
 */
function listingKeywordHintsForServiceSlug(slugGlobalNorm: string): string[] | undefined {
  const m: Record<string, string[]> = {
    // 8 Nhóm dịch vụ chính (Chuẩn hóa chính xác theo search intent & quyết định chiến lược)
    'massage-spa': [
      'massage', 'mát xa', 'mat xa', 'body massage', 'foot massage', 'thái', 'cổ truyền', 'hot stone', 'đá nóng', 'aroma',
      'gội đầu', 'gội đầu dưỡng sinh', 'head spa',
      'ráy tai', 'ray tai', 'lấy ráy', 'lay ray', 'ear cleaning',
      'xông hơi', 'sauna', 'spa',
      'chăm sóc da', 'cham soc da', 'facial', 'peel', 'skin care',
    ],
    'beauty-hair': [
      'nail', 'làm móng', 'lam mong', 'nails', 'mani', 'pedi',
      'lông mi', 'long mi', 'lông mày', 'long may', 'mi nối', 'nối mi', 'lashes', 'brows',
      'làm tóc', 'lam toc', 'cắt tóc', 'uốn tóc', 'nhuộm', 'hair', 'barber',
      'wax', 'waxing', 'tẩy lông',
      'trang điểm', 'trang diem', 'makeup', 'lam dep', 'làm đẹp',
    ],
    'food-drink': [
      'món việt', 'mon viet', 'street food',
      'nhà hàng', 'nha hang', 'restaurant', 'fine dining', 'chay', 'vegan', 'halal',
      'cafe', 'cà phê', 'ca phe', 'coffee',
      'quán bar', 'quan bar', 'pub', 'beer', 'quán ăn', 'quan an', 'buffet', 'ẩm thực', 'am thuc',
    ],
    tours: [
      'city tour', 'food tour', 'day trip',
      'cooking class', 'lớp nấu ăn',
      'vé tham quan', 've tham quan', 'ticket', 'attraction',
      'golf', 'sân golf',
      'hoạt động ngoài trời', 'hoat dong ngoai troi', 'outdoor',
      'tour', 'trải nghiệm', 'trai nghiem', 'experience', 'activity',
    ],
    transport: [
      'sân bay', 'san bay', 'airport transfer', 'đưa đón',
      'thuê xe', 'thue xe', 'xe máy', 'ô tô', 'car rental',
      'xe có tài xế', 'private driver',
      'limousine', 'bus', 'liên tỉnh',
      'vé tàu', 've tau', 'train',
      'di chuyển', 'di chuyen', 'transport',
    ],
    stay: [
      'khách sạn', 'khach san', 'hotel',
      'resort', 'homestay', 'villa',
      'căn hộ', 'can ho', 'dài ngày', 'long stay', 'serviced apartment',
      'lưu trú', 'luu tru', 'stay',
    ],
    health: [
      'hiệu thuốc', 'hieu thuoc', 'pharmacy', 'nhà thuốc', '24h',
      'phòng khám', 'phong kham', 'clinic', 'quốc tế', 'international clinic',
      'nha khoa', 'nha khoa', 'dental', 'răng', 'rang',
      'cấp cứu', 'cap cuu', 'emergency',
      'sức khỏe', 'suc khoe', 'health', 'y tế', 'medical', 'trị liệu',
    ],
    essentials: [
      'esim', 'sim', 'wifi', '4g', '5g',
      'đổi tiền', 'doi tien', 'money exchange', 'atm',
      'giặt là', 'giat la', 'giặt ủi', 'laundry',
      'gửi hành lý', 'gui hanh ly', 'luggage', 'storage',
      'may đo', 'may do', 'tailor',
      'coworking', 'co-working',
      'phòng chờ', 'phong cho', 'lounge', 'tiện ích', 'tien ich', 'essentials',
    ],

    // Các dịch vụ lẻ / slug cũ (Duy trì fallback cho API/URL cũ)
    massage: ['massage', 'mát xa', 'mat xa', 'body massage', 'foot massage'],
    'head-spa': ['gội đầu', 'gội đầu dưỡng sinh', 'head spa'],
    'ear-spa': ['ráy tai', 'ray tai', 'lấy ráy', 'lay ray', 'ear cleaning'],
    skincare: ['chăm sóc da', 'cham soc da', 'facial', 'peel', 'skin care'],
    'lashes-brows': ['lông mi', 'long mi', 'lông mày', 'long may', 'mi nối', 'nối mi'],
    nail: ['nail &', 'nail care', 'nail ', 'làm móng', 'lam mong', 'nails'],
    nails: ['làm móng', 'lam mong', 'nails'],
    dental: ['nha khoa', 'dental', 'răng sứ', 'răng'],
    hair: ['làm tóc', 'lam toc', 'uốn tóc', 'nhuộm', 'barber'],
    restaurant: ['nhà hàng', 'nha hang', 'restaurant', 'cafe', 'cà phê'],
    golf: ['golf', 'sân golf'],
    'hotel-resort': ['khách sạn', 'khach san', 'hotel', 'resort', 'homestay'],
  };
  return m[slugGlobalNorm];
}

function buildCityTextHints(citySlug?: string, cityNameVi?: string | null): string[] {
  const hints = new Set<string>();
  const pushHint = (raw?: string | null) => {
    if (!raw) return;
    const normalized = raw.trim().toLowerCase();
    if (!normalized) return;
    hints.add(normalized);
    hints.add(normalized.replace(/-/g, ' '));
  };
  pushHint(citySlug);
  pushHint(cityNameVi);
  if (citySlug === 'ha-noi') {
    hints.add('hà nội');
    hints.add('ha noi');
    hints.add('ha-noi');
  }
  return [...hints];
}

/** Cùng logic LIKE với `queryDealsRaw` khi lọc Hà Nội qua text địa chỉ spa (deal thiếu city_id / spa_location). */
function buildHaNoiAddressLikePatterns(): string[] {
  return buildCityTextHints('ha-noi', null).map((h) => `%${h}%`);
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class DealsService {
  private readonly logger = new Logger(DealsService.name);

  private flashWindowCache: { minuteKey: string; value: FlashSaleWindowState; expiresAt: number } | null =
    null;

  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly tracking: TrackingService,
    private readonly photoCache: PhotoCacheService,
  ) { }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async resolveServiceKeywordHints(serviceSlug: string): Promise<string[] | undefined> {
    const rawSlug = serviceSlug.trim();
    if (!rawSlug) return undefined;

    // Keep the keyword fallback active for partially backfilled data.
    // Strict matching via category/tags still runs first; hints only broaden matching
    // for uncategorized deals in buildDealServiceFilterSql().
    const mapped = listingKeywordHintsForServiceSlug(rawSlug.toLowerCase());
    return mapped?.length
      ? mapped
      : [rawSlug.replace(/-/g, ' ').replace(/\s+/g, ' ').trim()].filter(Boolean);
  }

  /**
   * Same priority as spa detail / recommended list: signed avatar → gallery → Places primary (GCS).
   */
  private async resolveSpaDisplayPhoto(opts: {
    spaId: string;
    spaAvatar: string | null;
    spaPhotos: unknown;
    googlePlaceId: string | null;
  }): Promise<string | null> {
    const fromAvatar = await this.photoCache.toDisplayUrl(opts.spaAvatar ?? null);
    if (fromAvatar) return fromAvatar;
    const [gal] = await this.db
      .select({ imageUrl: schema.spaGalleries.imageUrl })
      .from(schema.spaGalleries)
      .where(eq(schema.spaGalleries.spaId, opts.spaId))
      .orderBy(schema.spaGalleries.sortOrder)
      .limit(1);
    if (gal?.imageUrl) {
      const u = await this.photoCache.toDisplayUrl(String(gal.imageUrl));
      if (u) return u;
    }
    return this.photoCache.resolvePrimaryPhotoUrl(opts.spaId, opts.spaPhotos, opts.googlePlaceId);
  }

  /** One resolved display URL per spa (dedupe by spa_id). */
  private async batchSpaDisplayPhotos(rows: RawDealRow[]): Promise<Map<string, string | null>> {
    const seen = new Map<string, RawDealRow>();
    for (const r of rows) {
      if (r.spaId && !seen.has(r.spaId)) seen.set(r.spaId, r);
    }
    const out = new Map<string, string | null>();
    await Promise.all(
      [...seen.entries()].map(async ([spaId, sample]) => {
        const url = await this.resolveSpaDisplayPhoto({
          spaId,
          spaAvatar: sample.spaAvatar,
          spaPhotos: sample.spaPhotos,
          googlePlaceId: sample.googlePlaceId,
        });
        out.set(spaId, url);
      }),
    );
    return out;
  }

  private buildSpaBasic(
    row: RawDealRow,
    userLat?: number,
    userLng?: number,
    extras?: { viewCount?: number; photoUrl?: string | null; locale?: DealLocale },
  ): SpaBasicDto {
    const lat = row.spaLat ? parseFloat(row.spaLat) : null;
    const lng = row.spaLng ? parseFloat(row.spaLng) : null;

    const distanceKm =
      Number.isFinite(userLat) && Number.isFinite(userLng) && lat !== null && lng !== null
        ? Math.round(haversineKm(userLat!, userLng!, lat, lng) * 10) / 10
        : null;

    const displayUrl = extras?.photoUrl ?? null;
    const cityLabel = pickLocalizedText(
      { vi: row.cityName, en: row.cityNameEn, ko: row.cityNameKo },
      extras?.locale,
    );
    const dto: SpaBasicDto = {
      id: row.spaId ?? '',
      slug: row.spaSlug ?? '',
      name: row.spaName ?? '',
      ratingValue: row.spaRating ? parseFloat(row.spaRating) : 0,
      reviewCount: row.spaReviewCount ?? 0,
      cityName: cityLabel || row.cityName || null,
      distanceKm,
      lat: lat ?? null,
      lng: lng ?? null,
      photoName: displayUrl,
      spaAvatarUrl: displayUrl ?? row.coverImageUrl ?? null,
      openingHours: row.spaOpeningHours ? parseOpeningHours(row.spaOpeningHours) : null,
    };
    if (extras?.viewCount !== undefined) dto.viewCount = extras.viewCount;
    return dto;
  }

  /**
   * Flash UI (badge / countdown) chỉ khi deal nằm trong khung resolveFlashSaleWindow
   * (slot 60–120 phút hoặc nhóm timestamp), không dùng chỉ start_at/end_at campaign.
   */
  private buildDealCard(
    row: RawDealRow,
    spa: SpaBasicDto,
    flashDealIdSet: Set<number>,
    locale?: DealLocale,
    isFlashSaleTag = false,
  ): DealCardDto {
    const inFlashWindow = flashDealIdSet.has(row.id);
    const dealPathSlug =
      locale === 'en' ? (row.slugEn ?? canonicalDealSlug(row.slugVi, row.id))
        : locale === 'ko' ? (row.slugKo ?? canonicalDealSlug(row.slugVi, row.id))
          : canonicalDealSlug(row.slugVi, row.id);
    return {
      id: row.id,
      slug: dealPathSlug,
      canonicalSlug: dealPathSlug,
      title: pickDealDisplayTitle(
        {
          titleVi: row.titleVi,
          titleEn: row.titleEn,
          titleKo: row.titleKo,
          serviceNameVi: row.serviceNameVi,
          serviceNameEn: row.serviceNameEn,
          serviceNameKo: row.serviceNameKo,
          cityName: row.cityName,
          cityNameEn: row.cityNameEn,
          cityNameKo: row.cityNameKo,
        },
        locale,
      ),
      coverImageUrl: row.coverImageUrl,
      originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : null,
      salePrice: row.salePrice ? parseFloat(row.salePrice) : null,
      discountPercent: row.discountPercent,
      currency: row.currency ?? 'VND',
      ...buildDealScheduleFields(row.startAt, row.endAt),
      isFlashSale: inFlashWindow,
      tag: (isFlashSaleTag || inFlashWindow) ? 'flash_sale' : null,
      spa,
    };
  }

  /** Resolve city/district/ward IDs từ slugs (song song khi có nhiều slug). */
  private async resolveLocationIds(query: DealsQueryDto): Promise<ResolvedLocationIds> {
    const [cityRow, districtRow, wardRow, placeRow] = await Promise.all([
      query.city_slug
        ? this.db
          .select({ id: schema.cities.id, nameVi: schema.cities.nameVi })
          .from(schema.cities)
          .where(eq(schema.cities.slug, query.city_slug))
          .limit(1)
        : Promise.resolve([] as { id: number; nameVi: string | null }[]),
      query.district_slug
        ? this.db
          .select({ id: schema.districts.id })
          .from(schema.districts)
          .where(eq(schema.districts.slug, query.district_slug))
          .limit(1)
        : Promise.resolve([] as { id: number }[]),
      query.ward_slug
        ? this.db
          .select({ id: schema.wards.id })
          .from(schema.wards)
          .where(eq(schema.wards.slug, query.ward_slug))
          .limit(1)
        : Promise.resolve([] as { id: number }[]),

      query.place_slug
        ? this.db
          .select({ id: schema.places.id, lat: schema.places.lat, lng: schema.places.lng })
          .from(schema.places)
          .where(and(eq(schema.places.slug, query.place_slug), eq(schema.places.isActive, true)))
          .limit(1)
        : Promise.resolve([] as { id: number, lat: string | null, lng: string | null }[]),
    ]);

    let cityId: number | undefined;
    let cityNameVi: string | undefined;
    if (query.city_slug) {
      const city = cityRow[0];
      if (!city) throw new NotFoundException(`City "${query.city_slug}" not found`);
      cityId = city.id;
      cityNameVi = city.nameVi ?? undefined;
    }

    let districtId: number | undefined;
    if (query.district_slug) {
      const district = districtRow[0];
      if (!district) throw new NotFoundException(`District "${query.district_slug}" not found`);
      districtId = district.id;
    }

    let wardId: number | undefined;
    if (query.ward_slug) {
      const ward = wardRow[0];
      if (!ward) throw new NotFoundException(`Ward "${query.ward_slug}" not found`);
      wardId = ward.id;
    }

    let placeId: number | undefined;
    let placeLat: number | undefined;
    let placeLng: number | undefined;
    if (query.place_slug) {
      const place = placeRow[0];
      if (!place) throw new NotFoundException(`Place "${query.place_slug}" not found`);
      placeId = place.id;
      if (place.lat != null && place.lng != null) {
        placeLat = parseFloat(place.lat);
        placeLng = parseFloat(place.lng);
      }
    }

    return { cityId, districtId, wardId, placeId, cityNameVi, placeLat, placeLng };
  }

  /**
   * Điều kiện lọc theo category/service — dùng chung `queryDealsRaw` và đếm deal trên chip khu vực.
   * (Cần join `spas` + `services` như trong queryDealsRaw.)
   */
  private buildDealServiceFilterSql(serviceSlug: string, serviceCode?: string, serviceKeywordHints?: string[]): SQL {
    const terms = expandServiceSlugToTerms(serviceSlug, serviceCode);
    const termsSql = sql`array[${sql.join(terms.map((t) => sql`${t}`), sql`, `)}]::text[]`;

    const strictServiceSql = sql`(
          EXISTS (
            SELECT 1 FROM unnest(
              coalesce(${schema.deals.serviceTags}, array[]::text[])
              || coalesce(${schema.deals.serviceCategories}, array[]::text[])
            ) AS t(tag)
            WHERE lower(trim(t.tag::text)) = ANY(${termsSql})
               OR lower(regexp_replace(trim(t.tag::text), '\\s+', '-', 'g')) = ANY(${termsSql})
          )
          OR (
            ${schema.services.id} IS NOT NULL
            AND (
              lower(trim(${schema.services.slugGlobal})) = ANY(${termsSql})
              OR lower(trim(coalesce(${schema.services.slugVi}, ''))) = ANY(${termsSql})
              OR lower(trim(coalesce(${schema.services.slugEn}, ''))) = ANY(${termsSql})
              OR lower(trim(coalesce(${schema.services.slugKo}, ''))) = ANY(${termsSql})
              OR lower(trim(coalesce(${schema.services.code}, ''))) = ANY(${termsSql})
            )
          )
          OR EXISTS (
            SELECT 1 FROM spa_services ss
            JOIN services s ON s.id = ss.service_id
            LEFT JOIN services parent ON parent.id = s.category_id
            WHERE ss.spa_id = ${schema.deals.spaId}
            AND (
              lower(trim(s.slug_global)) = ANY(${termsSql})
              OR lower(trim(coalesce(s.slug_vi, ''))) = ANY(${termsSql})
              OR lower(trim(coalesce(s.slug_en, ''))) = ANY(${termsSql})
              OR lower(trim(coalesce(s.slug_ko, ''))) = ANY(${termsSql})
              OR lower(trim(coalesce(s.code, ''))) = ANY(${termsSql})
              OR (
                parent.id IS NOT NULL AND (
                  lower(trim(parent.slug_global)) = ANY(${termsSql})
                  OR lower(trim(coalesce(parent.slug_vi, ''))) = ANY(${termsSql})
                  OR lower(trim(coalesce(parent.slug_en, ''))) = ANY(${termsSql})
                  OR lower(trim(coalesce(parent.slug_ko, ''))) = ANY(${termsSql})
                  OR lower(trim(coalesce(parent.code, ''))) = ANY(${termsSql})
                )
              )
            )
          )
        )`;

    if (serviceKeywordHints?.length) {
      // NOTE: We intentionally ignore keyword hints now that the database has strict relational categories.
      // Doing text LIKE matches on title/description caused severe false positives (e.g. "Massage Trị liệu" matched Health).
    }
    return strictServiceSql;
  }

  /**
   * Số deal theo tỉnh/thành — cùng logic địa lý + flash + service với `getDeals`
   * (chip khu vực trên flash hub / trang category).
   */
  async countDealsPerCityForRegionChips(opts: {
    flashDealIds?: number[];
    serviceSlug?: string;
    serviceCode?: string;
  }): Promise<Map<number, number>> {
    const serviceSlug = opts.serviceSlug?.trim();
    const serviceCode = opts.serviceCode?.trim();
    const serviceKeywordHints = serviceSlug
      ? await this.resolveServiceKeywordHints(serviceSlug)
      : undefined;

    const flashIds = opts.flashDealIds?.filter((id) => Number.isFinite(id)) ?? [];

    const haNoiPatterns = buildHaNoiAddressLikePatterns();
    const hay = sql`lower(
      coalesce(${schema.spas.province}, '') || ' ' || coalesce(${schema.spas.address}, '') || ' ' ||
      coalesce(${schema.spas.description}, '') || ' ' || coalesce(${schema.spas.googleMapsUri}, '')
    )`;
    const haNoiOrs = haNoiPatterns.map((pat) => sql`${hay} LIKE ${pat}`);
    const haNoiTextSql = haNoiOrs.length ? sql`(${sql.join(haNoiOrs, sql` OR `)})` : sql`false`;

    const eligibleWhereParts: SQL[] = [eq(schema.deals.status, 'active'), dealWithinPublicationWindow()];
    if (flashIds.length) eligibleWhereParts.push(inArray(schema.deals.id, flashIds));
    if (serviceSlug || serviceCode) eligibleWhereParts.push(this.buildDealServiceFilterSql(serviceSlug ?? '', serviceCode, serviceKeywordHints));
    const eligibleWhere = and(...eligibleWhereParts);

    /** Một round-trip: eligible deals × (city_id qua deal_city_id | spa_locations | Hà Nội text), GROUP BY city. */
    const agg = sql`
      WITH eligible AS (
        SELECT ${schema.deals.id} AS id,
               ${schema.deals.spaId} AS spa_id,
               ${schema.deals.cityId} AS deal_city_id
        FROM ${schema.deals}
        INNER JOIN ${schema.spas} ON ${eq(schema.deals.spaId, schema.spas.id)}
        LEFT JOIN ${schema.services} ON ${eq(schema.deals.categoryId, schema.services.id)}
        WHERE ${eligibleWhere}
      ),
      pairs AS (
        SELECT eligible.deal_city_id AS city_id, eligible.id AS deal_id
        FROM eligible
        INNER JOIN ${schema.cities} ON ${schema.cities.id} = eligible.deal_city_id
        WHERE ${eq(schema.cities.isActive, true)}
          AND eligible.deal_city_id IS NOT NULL
        UNION
        SELECT ${schema.spaLocations.cityId} AS city_id, eligible.id AS deal_id
        FROM eligible
        INNER JOIN ${schema.spaLocations} ON (
          ${schema.spaLocations.spaId} = eligible.spa_id
          AND COALESCE(${schema.spaLocations.isActive}, true) = true
        )
        INNER JOIN ${schema.cities} ON ${schema.cities.id} = ${schema.spaLocations.cityId}
        WHERE ${eq(schema.cities.isActive, true)}
          AND ${schema.spaLocations.cityId} IS NOT NULL
        UNION
        SELECT ${schema.cities.id} AS city_id, eligible.id AS deal_id
        FROM eligible
        INNER JOIN ${schema.spas} ON ${eq(schema.spas.id, sql.raw('eligible.spa_id'))}
        INNER JOIN ${schema.cities} ON ${and(
      eq(schema.cities.isActive, true),
      sql`lower(${schema.cities.slug}) = 'ha-noi'`,
    )}
        WHERE ${haNoiTextSql}
      )
      SELECT ${schema.cities.id} AS id, COALESCE(cnt.n, 0)::int AS n
      FROM ${schema.cities}
      LEFT JOIN (
        SELECT city_id, COUNT(DISTINCT deal_id)::int AS n
        FROM pairs
        GROUP BY city_id
      ) cnt ON cnt.city_id = ${schema.cities.id}
      WHERE ${eq(schema.cities.isActive, true)}
    `;

    const res = await this.db.execute(agg);
    const rows = (res as unknown as { rows: { id: number; n: string | number }[] }).rows;
    return new Map(rows.map((r) => [r.id, Number(r.n ?? 0)]));
  }

  /**
   * Số deal theo quận trong một thành phố — đồng bộ với `getDeals` + chip khu vực.
   */
  async countDealsPerDistrictForRegionChips(
    citySlug: string,
    opts: { flashDealIds?: number[]; serviceSlug?: string; serviceCode?: string },
  ): Promise<Map<number, number>> {
    const [city] = await this.db
      .select({ id: schema.cities.id })
      .from(schema.cities)
      .where(and(eq(schema.cities.slug, citySlug), eq(schema.cities.isActive, true)))
      .limit(1);
    if (!city?.id) return new Map();

    const serviceSlug = opts.serviceSlug?.trim();
    const serviceCode = opts.serviceCode?.trim();
    const serviceKeywordHints = serviceSlug
      ? await this.resolveServiceKeywordHints(serviceSlug)
      : undefined;

    const flashIds = opts.flashDealIds?.filter((id) => Number.isFinite(id)) ?? [];

    const eligibleWhereParts: SQL[] = [eq(schema.deals.status, 'active'), dealWithinPublicationWindow()];
    if (flashIds.length) eligibleWhereParts.push(inArray(schema.deals.id, flashIds));
    if (serviceSlug || serviceCode) eligibleWhereParts.push(this.buildDealServiceFilterSql(serviceSlug ?? '', serviceCode, serviceKeywordHints));
    const eligibleWhere = and(...eligibleWhereParts);

    /** Một round-trip: eligible deals × (district_id trực tiếp | spa_locations trong city), GROUP BY district. */
    const agg = sql`
      WITH eligible AS (
        SELECT ${schema.deals.id} AS id,
               ${schema.deals.spaId} AS spa_id,
               ${schema.deals.districtId} AS deal_district_id
        FROM ${schema.deals}
        INNER JOIN ${schema.spas} ON ${eq(schema.deals.spaId, schema.spas.id)}
        LEFT JOIN ${schema.services} ON ${eq(schema.deals.categoryId, schema.services.id)}
        WHERE ${eligibleWhere}
      ),
      pairs AS (
        SELECT ${schema.districts.id} AS district_id, eligible.id AS deal_id
        FROM eligible
        INNER JOIN ${schema.districts} ON (
          ${schema.districts.id} = eligible.deal_district_id
          AND ${eq(schema.districts.cityId, city.id)}
          AND ${eq(schema.districts.isActive, true)}
        )
        WHERE eligible.deal_district_id IS NOT NULL
        UNION
        SELECT ${schema.districts.id} AS district_id, eligible.id AS deal_id
        FROM eligible
        INNER JOIN ${schema.spaLocations} ON (
          ${schema.spaLocations.spaId} = eligible.spa_id
          AND ${eq(schema.spaLocations.cityId, city.id)}
          AND COALESCE(${schema.spaLocations.isActive}, true) = true
          AND ${schema.spaLocations.districtId} IS NOT NULL
        )
        INNER JOIN ${schema.districts} ON (
          ${schema.districts.id} = ${schema.spaLocations.districtId}
          AND ${eq(schema.districts.cityId, city.id)}
          AND ${eq(schema.districts.isActive, true)}
        )
      )
      SELECT ${schema.districts.id} AS id, COALESCE(cnt.n, 0)::int AS n
      FROM ${schema.districts}
      LEFT JOIN (
        SELECT district_id, COUNT(DISTINCT deal_id)::int AS n
        FROM pairs
        GROUP BY district_id
      ) cnt ON cnt.district_id = ${schema.districts.id}
      WHERE ${and(eq(schema.districts.cityId, city.id), eq(schema.districts.isActive, true))}
    `;

    const res = await this.db.execute(agg);
    const rows = (res as unknown as { rows: { id: number; n: string | number }[] }).rows;
    return new Map(rows.map((r) => [r.id, Number(r.n ?? 0)]));
  }

  /** Khung flash hiện tại: slot 60–120 phút (ưu tiên) hoặc deal start/end cùng độ dài. */
  private async resolveFlashSaleWindow(now: Date): Promise<FlashSaleWindowState> {
    const empty = {
      mode: 'none' as const,
      variantIds: [] as number[],
      dealIds: [] as number[],
      windowStartsAt: null as Date | null,
      windowEndsAt: null as Date | null,
      windowLabel: null as string | null,
      applicableDurationMinutes: null as number | null,
    };

    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 8);

    const slotRows = await this.db
      .select({
        variantId: schema.dealTimeSlots.variantId,
        startTime: schema.dealTimeSlots.startTime,
        endTime: schema.dealTimeSlots.endTime,
      })
      .from(schema.dealTimeSlots)
      .where(
        and(
          eq(schema.dealTimeSlots.dayOfWeek, dayOfWeek),
          eq(schema.dealTimeSlots.isActive, true),
          sql`${schema.dealTimeSlots.startTime}::text <= ${currentTime}`,
          sql`${schema.dealTimeSlots.endTime}::text >= ${currentTime}`,
        ),
      );

    const validSlotRows = slotRows.filter(
      (r): r is { variantId: number; startTime: string; endTime: string } =>
        r.variantId != null &&
        Number.isFinite(Number(r.variantId)) &&
        !!r.startTime?.trim() &&
        !!r.endTime?.trim(),
    );

    const byWindow = new Map<string, { start: string; end: string; variantIds: number[] }>();

    for (const r of validSlotRows) {
      const start = r.startTime.trim();
      const end = r.endTime.trim();
      if (!nowInWallClockWindow(now, start, end)) continue;
      const dur = slotWallClockDurationMinutes(start, end);
      if (dur < FLASH_APPLICABLE_MIN_MINUTES || dur > FLASH_APPLICABLE_MAX_MINUTES) continue;
      const key = `${padTimeOfDay(start)}|${padTimeOfDay(end)}`;
      if (!byWindow.has(key)) {
        byWindow.set(key, { start, end, variantIds: [] });
      }
      byWindow.get(key)!.variantIds.push(r.variantId);
    }

    if (byWindow.size > 0) {
      let best: { start: string; end: string; variantIds: number[] } | null = null;
      for (const w of byWindow.values()) {
        if (!best || w.variantIds.length > best.variantIds.length) best = w;
      }
      if (best && best.variantIds.length > 0) {
        const uniqueVariants = [...new Set(best.variantIds)];
        const { startsAt, endsAt } = slotWindowBoundsLocal(now, best.start, best.end);
        const dur = Math.round(slotWallClockDurationMinutes(best.start, best.end));

        const dealRows = await this.db
          .select({ dealId: schema.dealVariants.dealId })
          .from(schema.dealVariants)
          .where(
            and(
              inArray(schema.dealVariants.id, uniqueVariants),
              eq(schema.dealVariants.isActive, true),
              sql`${schema.dealVariants.dealId} IS NOT NULL`,
            ),
          );
        const dealIds = [
          ...new Set(
            dealRows.map((x) => x.dealId).filter((id): id is number => id != null && Number.isFinite(id)),
          ),
        ];

        return {
          mode: 'slot',
          variantIds: uniqueVariants,
          dealIds,
          windowStartsAt: startsAt,
          windowEndsAt: endsAt,
          windowLabel: formatWindowLabel(best.start, best.end),
          applicableDurationMinutes: dur,
        };
      }
    }

    const twRows = await this.db
      .select({
        id: schema.deals.id,
        startAt: schema.deals.startAt,
        endAt: schema.deals.endAt,
      })
      .from(schema.deals)
      .where(
        and(
          eq(schema.deals.status, 'active'),
          sql`${schema.deals.startAt} IS NOT NULL`,
          sql`${schema.deals.endAt} IS NOT NULL`,
          lte(schema.deals.startAt, now),
          gte(schema.deals.endAt, now),
        ),
      );

    type Tw = { id: number; startAt: Date; endAt: Date };
    const withDur = (twRows as Tw[]).map((r) => {
      const min = (r.endAt.getTime() - r.startAt.getTime()) / 60_000;
      return { ...r, min };
    });
    const inBand = withDur.filter(
      (r) => r.min >= FLASH_APPLICABLE_MIN_MINUTES && r.min <= FLASH_APPLICABLE_MAX_MINUTES,
    );
    if (inBand.length === 0) return { ...empty };

    const byCamp = new Map<string, Tw[]>();
    for (const r of inBand) {
      const k = `${r.startAt.toISOString()}|${r.endAt.toISOString()}`;
      if (!byCamp.has(k)) byCamp.set(k, []);
      byCamp.get(k)!.push(r);
    }

    let bestG: Tw[] | null = null;
    for (const g of byCamp.values()) {
      if (!bestG || g.length > bestG.length) bestG = g;
    }
    if (!bestG?.length) return { ...empty };

    const startsAt = bestG.reduce((a, r) => (r.startAt < a ? r.startAt : a), bestG[0]!.startAt);
    const endsAt = bestG.reduce((a, r) => (r.endAt > a ? r.endAt : a), bestG[0]!.endAt);
    const dur = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);
    const timeFmt: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    const windowLabel = `${startsAt.toLocaleTimeString('en-GB', timeFmt)}–${endsAt.toLocaleTimeString('en-GB', timeFmt)}`;

    return {
      mode: 'timestamp',
      variantIds: [],
      dealIds: bestG.map((r) => r.id),
      windowStartsAt: startsAt,
      windowEndsAt: endsAt,
      windowLabel,
      applicableDurationMinutes: dur,
    };
  }

  /** Dùng chung cho page resolve: tránh gọi `resolveFlashSaleWindow` hai lần (getDeals + getFlashSale). */
  async snapshotFlashSaleWindow(): Promise<FlashSaleWindowState> {
    const now = new Date();
    const minuteKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;
    const ts = Date.now();
    if (this.flashWindowCache && this.flashWindowCache.minuteKey === minuteKey && this.flashWindowCache.expiresAt > ts) {
      return this.flashWindowCache.value;
    }
    const value = await this.resolveFlashSaleWindow(now);
    this.flashWindowCache = { minuteKey, value, expiresAt: ts + 45_000 };
    return value;
  }

  private async queryFlashDealsByDealIds(dealIds: number[]): Promise<RawDealRow[]> {
    const unique = [...new Set(dealIds.filter((id) => Number.isFinite(id)))];
    if (!unique.length) return [];
    return this.db
      .select(this.flashDealRowSelect())
      .from(schema.deals)
      .innerJoin(schema.spas, eq(schema.deals.spaId, schema.spas.id))
      .leftJoin(schema.cities, eq(schema.deals.cityId, schema.cities.id))
      .leftJoin(schema.services, eq(schema.deals.categoryId, schema.services.id))
      .where(and(eq(schema.deals.status, 'active'), dealWithinPublicationWindow(), inArray(schema.deals.id, unique)));
  }

  /** Query deals với full join (deals + prices + spa + city) */
  private async queryDealsRaw(filters: {
    cityId?: number;
    districtId?: number;
    wardId?: number;
    placeId?: number;
    serviceSlug?: string;
    serviceCode?: string;
    /** Chỉ dùng khi DB chưa backfill category_id — OR với lọc chặt, chỉ áp cho deal category_id IS NULL */
    serviceKeywordHints?: string[];
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    dealIds?: number[];
    citySlug?: string;
    cityNameVi?: string;
    /** Lọc spa có tọa độ trong bán kính Haversine (km) quanh điểm này. */
    nearPointKm?: { lat: number; lng: number; radiusKm: number };
    extraFilters?: Record<string, boolean>;
  }): Promise<RawDealRow[]> {
    const conditions = [eq(schema.deals.status, 'active'), dealWithinPublicationWindow()];

    if (filters.dealIds?.length) {
      conditions.push(inArray(schema.deals.id, filters.dealIds));
    }

    if (filters.cityId) {
      const cityHints = buildCityTextHints(filters.citySlug, filters.cityNameVi);
      const cityTextFallback =
        cityHints.length > 0
          ? sql` OR (${sql.join(
            cityHints.map(
              (hint) =>
                sql`lower(coalesce(${schema.spas.province}, '') || ' ' || coalesce(${schema.spas.address}, '') || ' ' || coalesce(${schema.spas.description}, '') || ' ' || coalesce(${schema.spas.googleMapsUri}, '')) LIKE ${`%${hint}%`}`,
            ),
            sql` OR `,
          )})`
          : sql``;
      conditions.push(sql`(
        ${schema.deals.cityId} = ${filters.cityId}
        OR EXISTS (
          SELECT 1
          FROM spa_locations sl
          WHERE sl.spa_id = ${schema.deals.spaId}
            AND sl.city_id = ${filters.cityId}
            AND COALESCE(sl.is_active, true) = true
        )${cityTextFallback}
      )`);
    }
    if (filters.districtId) {
      conditions.push(sql`EXISTS (
        SELECT 1
        FROM spa_locations sl
        WHERE sl.spa_id = ${schema.deals.spaId}
          AND sl.district_id = ${filters.districtId}
          AND COALESCE(sl.is_active, true) = true
      )`);
    }
    if (filters.wardId) {
      conditions.push(sql`EXISTS (
        SELECT 1
        FROM spa_locations sl
        WHERE sl.spa_id = ${schema.deals.spaId}
          AND sl.ward_id = ${filters.wardId}
          AND COALESCE(sl.is_active, true) = true
      )`);
    }
    if (filters.placeId) {
      conditions.push(sql`EXISTS (
        SELECT 1
        FROM spa_locations sl
        WHERE sl.spa_id = ${schema.deals.spaId}
          AND sl.place_id = ${filters.placeId}
          AND COALESCE(sl.is_active, true) = true
      )`);
    }
    if (filters.nearPointKm) {
      const cLat = filters.nearPointKm.lat;
      const cLng = filters.nearPointKm.lng;
      const rKm = filters.nearPointKm.radiusKm;
      conditions.push(sql`(
        EXISTS (
          SELECT 1 FROM spa_locations sl
          WHERE sl.spa_id = ${schema.deals.spaId}
            AND COALESCE(sl.is_active, true) = true
            AND sl.lat IS NOT NULL AND sl.lng IS NOT NULL
            AND (
              6371.0 * 2 * asin(sqrt(least(1.0::float8, greatest(0.0::float8,
                power(sin(radians((${cLat}::float8 - sl.lat::float8) / 2.0)), 2) +
                cos(radians(${cLat}::float8)) * cos(radians(sl.lat::float8)) *
                power(sin(radians((${cLng}::float8 - sl.lng::float8) / 2.0)), 2)
              ))))
            ) <= ${rKm}::float8
        )
        OR (
          ${schema.spas.latitude} IS NOT NULL AND ${schema.spas.longitude} IS NOT NULL
          AND (
            6371.0 * 2 * asin(sqrt(least(1.0::float8, greatest(0.0::float8,
              power(sin(radians((${cLat}::float8 - ${schema.spas.latitude}::float8) / 2.0)), 2) +
              cos(radians(${cLat}::float8)) * cos(radians(${schema.spas.latitude}::float8)) *
              power(sin(radians((${cLng}::float8 - ${schema.spas.longitude}::float8) / 2.0)), 2)
            ))))
          ) <= ${rKm}::float8
        )
      )`);
    }
    if (filters.serviceSlug || filters.serviceCode) {
      conditions.push(this.buildDealServiceFilterSql(filters.serviceSlug ?? '', filters.serviceCode, filters.serviceKeywordHints));
    }
    if (filters.minPrice !== undefined) {
      conditions.push(
        sql`(
          SELECT dvp.sale_price FROM deal_variants dv
          JOIN deal_variant_prices dvp ON dvp.variant_id = dv.id AND dvp.is_active = true
          WHERE dv.deal_id = ${schema.deals.id}
          ORDER BY dvp.sale_price ASC NULLS LAST LIMIT 1
        ) >= ${filters.minPrice}`,
      );
    }
    if (filters.maxPrice !== undefined) {
      conditions.push(
        sql`(
          SELECT dvp.sale_price FROM deal_variants dv
          JOIN deal_variant_prices dvp ON dvp.variant_id = dv.id AND dvp.is_active = true
          WHERE dv.deal_id = ${schema.deals.id}
          ORDER BY dvp.sale_price ASC NULLS LAST LIMIT 1
        ) <= ${filters.maxPrice}`,
      );
    }
    if (filters.minRating !== undefined) {
      conditions.push(sql`${schema.spas.ratingValue}::numeric >= ${filters.minRating}`);
    }

    if (filters.extraFilters) {
      const spaKeys = new Set(
        Object.values(SPA_EXTRA_ATTRS).flatMap((arr) => arr.map((item) => item.key)),
      );
      Object.entries(filters.extraFilters).forEach(([key, val]) => {
        if (val) {
          const jsonObj = JSON.stringify({ [key]: true });
          if (spaKeys.has(key)) {
            conditions.push(sql`${schema.spas.extraAttributes} @> ${jsonObj}::jsonb`);
          } else {
            conditions.push(sql`${schema.deals.extraAttributes} @> ${jsonObj}::jsonb`);
          }
        }
      });
    }

    return this.db
      .select({
        id: schema.deals.id,
        slugVi: schema.deals.slugVi,
        slugEn: schema.deals.slugEn,
        slugKo: schema.deals.slugKo,
        titleVi: schema.deals.titleVi,
        titleEn: schema.deals.titleEn,
        titleKo: schema.deals.titleKo,
        coverImageUrl: schema.deals.coverImageUrl,
        discountPercent: schema.deals.discountPercent,
        currency: schema.deals.currency,
        startAt: schema.deals.startAt,
        endAt: schema.deals.endAt,
        spaId: schema.deals.spaId,
        cityId: schema.deals.cityId,
        districtId: schema.deals.districtId,
        // Best active sale price per deal via subquery
        salePrice: sql<string>`(
          SELECT dvp.sale_price::text
          FROM deal_variants dv
          JOIN deal_variant_prices dvp ON dvp.variant_id = dv.id AND dvp.is_active = true
          WHERE dv.deal_id = ${schema.deals.id}
          ORDER BY dvp.sale_price ASC NULLS LAST
          LIMIT 1
        )`,
        originalPrice: sql<string>`(
          SELECT dvp.original_price::text
          FROM deal_variants dv
          JOIN deal_variant_prices dvp ON dvp.variant_id = dv.id AND dvp.is_active = true
          WHERE dv.deal_id = ${schema.deals.id}
          ORDER BY dvp.sale_price ASC NULLS LAST
          LIMIT 1
        )`,
        spaSlug: schema.spas.slug,
        spaName: schema.spas.name,
        spaRating: schema.spas.ratingValue,
        spaReviewCount: schema.spas.reviewCount,
        spaPhotos: schema.spas.photos,
        spaAvatar: schema.spas.spaAvatar,
        spaLat: schema.spas.latitude,
        spaLng: schema.spas.longitude,
        googlePlaceId: schema.spas.googlePlaceId,
        cityName: schema.cities.nameVi,
        cityNameEn: schema.cities.nameEn,
        cityNameKo: schema.cities.nameKo,
        serviceNameVi: schema.services.nameVi,
        serviceNameEn: schema.services.nameEn,
        serviceNameKo: schema.services.nameKo,
        spaOpeningHours: schema.spas.openingHours,
      })
      .from(schema.deals)
      .innerJoin(schema.spas, eq(schema.deals.spaId, schema.spas.id))
      .leftJoin(schema.cities, eq(schema.deals.cityId, schema.cities.id))
      .leftJoin(schema.services, eq(schema.deals.categoryId, schema.services.id))
      .where(and(...conditions));
  }

  /** Group deals by spa, top 2 deals/spa theo discount cao nhất (ảnh spa + viewCount enrich sau pagination). */
  private groupBySpaTakeTop2(
    rows: RawDealRow[],
    flashDealIdSet: Set<number>,
    userLat: number | undefined,
    userLng: number | undefined,
    locale: DealLocale | undefined,
  ): SpaGroupInternal[] {
    const spaMap = new Map<string, SpaGroupInternal>();

    for (const row of rows) {
      const spaId = row.spaId ?? 'unknown';
      if (!spaMap.has(spaId)) {
        spaMap.set(spaId, {
          spa: this.buildSpaBasic(row, userLat, userLng, { locale }),
          deals: [],
          minSalePrice: null,
          maxSalePrice: null,
          maxDiscountPercent: null,
          openingHoursRaw: row.spaOpeningHours,
        });
      }
      const group = spaMap.get(spaId)!;
      const salePrice = row.salePrice ? parseFloat(row.salePrice) : null;
      if (salePrice !== null && Number.isFinite(salePrice)) {
        group.minSalePrice = group.minSalePrice === null ? salePrice : Math.min(group.minSalePrice, salePrice);
        group.maxSalePrice = group.maxSalePrice === null ? salePrice : Math.max(group.maxSalePrice, salePrice);
      }
      const discount = parseDiscountPercent(row.discountPercent);
      if (Number.isFinite(discount)) {
        group.maxDiscountPercent =
          group.maxDiscountPercent === null ? discount : Math.max(group.maxDiscountPercent, discount);
      }
      if (group.deals.length < 2) {
        group.deals.push(this.buildDealCard(row, group.spa, flashDealIdSet, locale));
      }
    }

    return Array.from(spaMap.values());
  }

  /** Spa chỉ trên page hiện tại — tránh N× signed URL / Places cho cả category. */
  private async enrichPaginatedGroups(
    rows: RawDealRow[],
    paginated: SpaGroupInternal[],
    query: DealsQueryDto,
    flashDealIdSet: Set<number>,
  ): Promise<void> {
    if (paginated.length === 0) return;
    const dealRowById = new Map(rows.map((r) => [r.id, r]));
    const pageSpaIds = new Set(paginated.map((g) => g.spa.id).filter(Boolean));
    const engagementEntries = paginated
      .filter((g) => g.spa.id && g.spa.slug)
      .map((g) => ({ spaId: g.spa.id, slug: g.spa.slug }));
    const samples: RawDealRow[] = [];
    const seenSpa = new Set<string>();
    for (const row of rows) {
      const sid = row.spaId;
      if (!sid || !pageSpaIds.has(sid) || seenSpa.has(sid)) continue;
      seenSpa.add(sid);
      samples.push(row);
    }
    const tBatch = Date.now();
    const [viewBySlug, photoBySpaId] = await Promise.all([
      this.tracking.batchSpaDisplayEngagement(engagementEntries),
      this.batchSpaDisplayPhotos(samples),
    ]);
    this.logger.debug(
      `getDeals enrich batchMs=${Date.now() - tBatch}ms pageSpas=${samples.length} pageGroups=${paginated.length}`,
    );
    for (const g of paginated) {
      const sample = rows.find((r) => r.spaId === g.spa.id);
      if (!sample) continue;
      const slug = sample.spaSlug ?? '';
      const vc = viewBySlug.get(slug) ?? 0;
      const photoUrl = sample.spaId ? (photoBySpaId.get(sample.spaId) ?? null) : null;
      const spa = this.buildSpaBasic(sample, query.lat, query.lng, {
        viewCount: vc,
        photoUrl,
        locale: query.locale,
      });
      g.spa = spa;
      g.deals = g.deals.map((dc) => {
        const row = dealRowById.get(dc.id);
        return row ? this.buildDealCard(row, spa, flashDealIdSet, query.locale) : dc;
      });
    }
  }

  /** Sort spa groups theo yêu cầu */
  private sortGroups(
    groups: SpaGroupInternal[],
    sort: DealSortOrder,
  ): SpaGroupInternal[] {
    return groups.sort((a, b) => {
      switch (sort) {
        case DealSortOrder.DISTANCE:
          return (a.spa.distanceKm ?? Infinity) - (b.spa.distanceKm ?? Infinity);
        case DealSortOrder.PRICE_ASC:
          return (a.minSalePrice ?? Infinity) - (b.minSalePrice ?? Infinity);
        case DealSortOrder.PRICE_DESC:
          return (b.maxSalePrice ?? -Infinity) - (a.maxSalePrice ?? -Infinity);
        case DealSortOrder.DISCOUNT_DESC:
          return (b.maxDiscountPercent ?? -Infinity) - (a.maxDiscountPercent ?? -Infinity);
        case DealSortOrder.RATING:
        default:
          return b.spa.ratingValue - a.spa.ratingValue;
      }
    });
  }

  // ── Public methods ─────────────────────────────────────────────────────────

  async getDeals(
    query: DealsQueryDto,
    opts?: GetDealsCallOptions,
  ): Promise<{
    data: SpaDealsGroupDto[];
    meta: PaginationMeta;
  }> {
    const t0 = Date.now();
    const placeHubGeo = opts?.placeHubGeo;
    const locationQuery = placeHubGeo ? { ...query, place_slug: undefined } : query;
    const { cityId, districtId, wardId, placeId, cityNameVi, placeLat, placeLng } =
      await this.resolveLocationIds(locationQuery);
    this.logger.debug(`getDeals profile resolveLocationIds=${Date.now() - t0}ms`);

    const tFlash = Date.now();
    const flashCtx = opts?.flashSaleWindow ?? (await this.resolveFlashSaleWindow(new Date()));
    this.logger.debug(
      `getDeals profile flashWindow=${Date.now() - tFlash}ms reused=${!!opts?.flashSaleWindow}`,
    );

    if (query.flash_sale_only) {
      if (flashCtx.mode === 'none' || !flashCtx.dealIds.length) {
        const { page, limit } = query;
        return {
          data: [],
          meta: buildPaginationMeta(page ?? 1, limit ?? 20, 0),
        };
      }
    }

    const rawSlug = query.flash_sale_only ? undefined : query.service_slug?.trim();
    const rawCode = query.flash_sale_only ? undefined : query.service_code?.trim();
    const serviceKeywordHints = rawSlug ? await this.resolveServiceKeywordHints(rawSlug) : undefined;

    // Deals đã sort theo discount DESC trước khi group (để top 2 có discount cao nhất)
    const tQueryDealsRaw = Date.now();
    const tQuery = Date.now();
    // Xác định xem có kích hoạt thuật toán quét 20km hay không
    const combinedNearPoint = placeHubGeo
      ? placeHubGeo
      : (placeLat !== undefined && placeLng !== undefined)
        ? { lat: placeLat, lng: placeLng, radiusKm: PLACE_SEO_HUB_RADIUS_KM }
        : undefined;

    const rows = await this.queryDealsRaw({
      cityId: combinedNearPoint ? undefined : cityId,
      districtId: combinedNearPoint ? undefined : districtId,
      wardId: combinedNearPoint ? undefined : wardId,
      placeId: combinedNearPoint ? undefined : placeId,
      serviceSlug: rawSlug,
      serviceCode: rawCode,
      serviceKeywordHints,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      minRating: query.minRating,
      dealIds: query.flash_sale_only ? flashCtx.dealIds : undefined,
      citySlug: query.city_slug,
      cityNameVi,
      nearPointKm: combinedNearPoint,
      extraFilters: query.extraFilters,
    });
    this.logger.debug(
      `getDeals profile queryDealsRaw rows=${rows.length} ms=${Date.now() - tQueryDealsRaw}ms`,
    );

    rows.sort(
      (a, b) =>
        parseDiscountPercent(b.discountPercent) - parseDiscountPercent(a.discountPercent),
    );

    const flashDealIdSet = new Set(flashCtx.dealIds);
    const tGroup = Date.now();
    let allGroups = this.groupBySpaTakeTop2(
      rows,
      flashDealIdSet,
      query.lat,
      query.lng,
      query.locale,
    );

    if (query.isOpenNow) {
      const now = new Date();
      allGroups = allGroups.filter((g) => isSpaOpenNow(g.openingHoursRaw, now));
    }

    const sort = query.sort ?? DealSortOrder.RATING;
    const sorted = this.sortGroups(allGroups, sort);
    this.logger.debug(
      `getDeals profile groupSort groups=${allGroups.length} ms=${Date.now() - tGroup}ms`,
    );

    const total = sorted.length;
    const { page, limit } = query;
    const paginated = sorted.slice((page - 1) * limit, page * limit);

    const tEnrich = Date.now();
    await this.enrichPaginatedGroups(rows, paginated, query, flashDealIdSet);
    this.logger.debug(`getDeals profile enrichPaginated ms=${Date.now() - tEnrich}ms`);

    this.logger.debug(`getDeals profile totalMs=${Date.now() - t0}ms`);

    return {
      data: paginated.map((g) => ({ spa: g.spa, deals: g.deals })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getDealByIdOrSlug(idOrSlug: string, locale?: DealLocale): Promise<DealDetailDto> {
    const normalized = idOrSlug.trim().toLowerCase();
    const trailingIdMatch = normalized.match(/-(\d+)$/);
    const trailingId = trailingIdMatch ? parseInt(trailingIdMatch[1]!, 10) : null;
    const isNumeric = /^\d+$/.test(normalized);

    const queryDealRow = async (condition: any) => {
      const [row] = await this.db
        .select({
          id: schema.deals.id,
          slugVi: schema.deals.slugVi,
          slugEn: schema.deals.slugEn,
          slugKo: schema.deals.slugKo,
          titleVi: schema.deals.titleVi,
          titleEn: schema.deals.titleEn,
          titleKo: schema.deals.titleKo,
          shortDescriptionVi: schema.deals.shortDescriptionVi,
          shortDescriptionEn: schema.deals.shortDescriptionEn,
          shortDescriptionKo: schema.deals.shortDescriptionKo,
          contentVi: schema.deals.contentVi,
          contentEn: schema.deals.contentEn,
          contentKo: schema.deals.contentKo,
          coverImageUrl: schema.deals.coverImageUrl,
          discountPercent: schema.deals.discountPercent,
          currency: schema.deals.currency,
          startAt: schema.deals.startAt,
          endAt: schema.deals.endAt,
          isSoldOut: schema.deals.isSoldOut,
          status: schema.deals.status,
          spaId: schema.deals.spaId,
          spaSlug: schema.spas.slug,
          spaName: schema.spas.name,
          spaDescription: schema.spas.description,
          spaRating: schema.spas.ratingValue,
          spaReviewCount: schema.spas.reviewCount,
          spaPhotos: schema.spas.photos,
          spaAvatar: schema.spas.spaAvatar,
          googlePlaceId: schema.spas.googlePlaceId,
          spaLat: schema.spas.latitude,
          spaLng: schema.spas.longitude,
          cityName: schema.cities.nameVi,
          cityNameEn: schema.cities.nameEn,
          cityNameKo: schema.cities.nameKo,
          citySlug: schema.cities.slug,
          districtName: schema.districts.nameVi,
          districtNameEn: schema.districts.nameEn,
          districtNameKo: schema.districts.nameKo,
          districtSlug: schema.districts.slug,
          serviceSlug: schema.services.slugGlobal,
          serviceNameVi: schema.services.nameVi,
          serviceNameEn: schema.services.nameEn,
          serviceNameKo: schema.services.nameKo,
          // Spa contact fields — cho StickyContactBar & JSON-LD
          spaPhone: schema.spas.phone,
          spaZalo: schema.spas.messagingLinkZalo,
          spaFacebook: schema.spas.facebookLink,
          spaTelegram: schema.spas.messagingLinkTelegram,
          spaAddress: schema.spas.address,
        })
        .from(schema.deals)
        .innerJoin(schema.spas, eq(schema.deals.spaId, schema.spas.id))
        .leftJoin(schema.cities, eq(schema.deals.cityId, schema.cities.id))
        .leftJoin(schema.districts, eq(schema.deals.districtId, schema.districts.id))
        .leftJoin(schema.services, eq(schema.deals.categoryId, schema.services.id))
        .where(condition)
        .limit(1);
      return row;
    };

    let row: Awaited<ReturnType<typeof queryDealRow>> | undefined;
    if (isNumeric) {
      row = await queryDealRow(eq(schema.deals.id, parseInt(normalized, 10)));
    } else {
      const slugCandidates = [normalized];
      if (trailingId != null) {
        const stripped = normalized.replace(/-\d+$/, '');
        if (stripped) slugCandidates.push(stripped);
      }
      for (const slug of [...new Set(slugCandidates)]) {
        if (locale === 'en') {
          row = await queryDealRow(eq(schema.deals.slugEn, slug));
        } else if (locale === 'ko') {
          row = await queryDealRow(eq(schema.deals.slugKo, slug));
        } else {
          row = await queryDealRow(eq(schema.deals.slugVi, slug));
        }
        if (row) break;
      }
      // Fallback về slug_vi nếu slug_en/ko chưa có hoặc không tìm được
      if (!row && locale !== undefined) {
        for (const slug of [...new Set(slugCandidates)]) {
          row = await queryDealRow(eq(schema.deals.slugVi, slug));
          if (row) break;
        }
      }
      // Slug DB có thể chứa fragment kiểu "...#...."; browser không gửi phần sau '#'
      // nên path chỉ còn prefix trước '#'. Fallback: match slug bắt đầu bằng "<path>#".
      if (!row) {
        row = await queryDealRow(
          sql`lower(${schema.deals.slugVi}) LIKE ${`${normalized}#%`}`,
        );
      }

      // Fallback cho slug bị "méo" trên FE: thử bắt theo token đuôi (hash/id-like).
      // Ví dụ: "...-c252fa5ba6" → match deal có slug_vi kết thúc "-c252fa5ba6"
      const trailingTokenMatch = normalized.match(/-([a-z0-9]{6,})$/i);
      const trailingToken = trailingTokenMatch?.[1]?.toLowerCase();
      if (!row && trailingToken) {
        row = await queryDealRow(
          sql`lower(${schema.deals.slugVi}) LIKE ${`%-${trailingToken}`}`,
        );
      }
      // Nếu token là prefix của legacy UUID (10+ chars), fallback thêm theo legacy_deal_id.
      if (!row && trailingToken && trailingToken.length >= 8) {
        row = await queryDealRow(
          sql`lower(${schema.deals.legacyDealId}::text) LIKE ${`${trailingToken}%`}`,
        );
      }
      if (!row && trailingId != null) {
        row = await queryDealRow(eq(schema.deals.id, trailingId));
      }
    }

    if (!row) throw new NotFoundException(`Deal "${idOrSlug}" not found`);

    const dealId = row.id;
    const spaId = row.spaId ?? '';

    // Variants + prices + time slots + spa enrichment (all parallel)
    const [variantRows, mediaRows, spaLocRows, spaGalleryRows, spaReviewRows] = await Promise.all([
      this.db
        .select()
        .from(schema.dealVariants)
        .where(and(eq(schema.dealVariants.dealId, dealId), eq(schema.dealVariants.isActive, true)))
        .orderBy(schema.dealVariants.sortOrder),
      this.db
        .select()
        .from(schema.dealMedia)
        .where(eq(schema.dealMedia.dealId, dealId))
        .orderBy(schema.dealMedia.sortOrder),
      // Spa primary location — để lấy districtName + addressLine + cityName fallback
      spaId
        ? this.db
          .select({
            addressLine: schema.spaLocations.addressLine,
            cityName: schema.cities.nameVi,
            cityNameEn: schema.cities.nameEn,
            cityNameKo: schema.cities.nameKo,
            districtName: schema.districts.nameVi,
            districtNameEn: schema.districts.nameEn,
            districtNameKo: schema.districts.nameKo,
          })
          .from(schema.spaLocations)
          .leftJoin(schema.cities, eq(schema.spaLocations.cityId, schema.cities.id))
          .leftJoin(schema.districts, eq(schema.spaLocations.districtId, schema.districts.id))
          .where(
            and(
              eq(schema.spaLocations.spaId, spaId),
              eq(schema.spaLocations.isPrimary, true),
              eq(schema.spaLocations.isActive, true),
            ),
          )
          .limit(1)
        : Promise.resolve([]),
      // Spa gallery — để resolve signed URLs
      spaId
        ? this.db
          .select({ imageUrl: schema.spaGalleries.imageUrl })
          .from(schema.spaGalleries)
          .where(eq(schema.spaGalleries.spaId, spaId))
          .orderBy(schema.spaGalleries.sortOrder)
          .limit(5)
        : Promise.resolve([]),
      // Top 5 external reviews cho JSON-LD
      spaId
        ? this.db
          .select({
            id: schema.spaExternalReviews.id,
            authorName: schema.spaExternalReviews.authorName,
            rating: schema.spaExternalReviews.rating,
            content: schema.spaExternalReviews.content,
            reviewedAt: schema.spaExternalReviews.reviewedAt,
          })
          .from(schema.spaExternalReviews)
          .where(
            and(
              eq(schema.spaExternalReviews.spaId, spaId),
              sql`${schema.spaExternalReviews.rating}::numeric = 5`,
            ),
          )
          .orderBy(desc(schema.spaExternalReviews.reviewedAt))
          .limit(5)
        : Promise.resolve([]),
    ]);

    const variantIds = variantRows.map((v) => v.id);
    const [priceRows, timeSlotRows] = await Promise.all([
      variantIds.length > 0
        ? this.db
          .select()
          .from(schema.dealVariantPrices)
          .where(
            and(
              inArray(schema.dealVariantPrices.variantId, variantIds),
              eq(schema.dealVariantPrices.isActive, true),
            ),
          )
        : Promise.resolve([]),
      variantIds.length > 0
        ? this.db
          .select({
            startTime: schema.dealTimeSlots.startTime,
            endTime: schema.dealTimeSlots.endTime,
            dayOfWeek: schema.dealTimeSlots.dayOfWeek,
          })
          .from(schema.dealTimeSlots)
          .where(
            and(
              inArray(schema.dealTimeSlots.variantId, variantIds),
              eq(schema.dealTimeSlots.isActive, true),
            ),
          )
        : Promise.resolve([]),
    ]);

    let localizedShortDescription = pickLocalizedDealText(
      locale,
      row.shortDescriptionVi,
      row.shortDescriptionEn,
      row.shortDescriptionKo,
    );

    if (!localizedShortDescription || !localizedShortDescription.trim()) {
      const dealTitle = (locale === 'en' ? row.titleEn : locale === 'ko' ? row.titleKo : row.titleVi) || row.titleVi || 'dịch vụ';
      const spaName = row.spaName || 'Spa';
      const discountKo = row.discountPercent ? `${row.discountPercent}% 특별 할인!` : '특별한 혜택!';
      const discountEn = row.discountPercent ? `Get ${row.discountPercent}% off!` : 'Exclusive offer!';
      const discountVi = row.discountPercent ? `Giảm sốc ${row.discountPercent}%!` : 'Ưu đãi cực HOT!';

      const cityLabel = locale === 'en' ? row.cityNameEn : locale === 'ko' ? row.cityNameKo : row.cityName;
      const districtLabel = locale === 'en' ? row.districtNameEn : locale === 'ko' ? row.districtNameKo : row.districtName;
      const locStr = [districtLabel || row.districtName, cityLabel || row.cityName].filter(Boolean).join(', ');

      if (locale === 'ko') {
        localizedShortDescription = `${spaName}의 ${dealTitle}! ${discountKo} ${locStr ? locStr + ' ' : ''}최고의 마사지 특가. 지금 Glow Explore에서 실제 리뷰를 확인하고 간편하게 예약하세요!`;
      } else if (locale === 'en') {
        localizedShortDescription = `Book ${dealTitle} at ${spaName}${locStr ? ' in ' + locStr : ''}! ${discountEn} Compare services and book online easily with the best massage deals on Glow Explore!`;
      } else {
        localizedShortDescription = `Săn voucher ${dealTitle} tại ${spaName}${locStr ? ' (' + locStr + ')' : ''}. ${discountVi} Đặt lịch massage, làm đẹp trực tuyến giữ chỗ ngay hôm nay với giá tốt nhất trên Glow Explore!`;
      }
    }

    const localizedContent = pickLocalizedDealText(
      locale,
      row.contentVi,
      row.contentEn,
      row.contentKo,
    );
    const parsedFromDescription =
      parseTimeRangeFromText(localizedShortDescription) ??
      parseTimeRangeFromText(localizedContent) ??
      parseTimeRangeFromText(row.shortDescriptionVi ?? null) ??
      parseTimeRangeFromText(row.contentVi ?? null);

    let applicableStartTime: string | null = null;
    let applicableEndTime: string | null = null;

    if (parsedFromDescription) {
      applicableStartTime = parsedFromDescription.startTime;
      applicableEndTime = parsedFromDescription.endTime;
    } else if (timeSlotRows.length > 0) {
      const dayOfWeek = new Date().getDay();
      const todaySlots = timeSlotRows.filter(
        (s) => s.dayOfWeek != null && Number(s.dayOfWeek) === dayOfWeek,
      );
      const pool = todaySlots.length > 0 ? todaySlots : timeSlotRows;
      pool.sort((a, b) =>
        padTimeOfDay(String(a.startTime ?? '')).localeCompare(padTimeOfDay(String(b.startTime ?? ''))),
      );
      const slot = pool[0];
      if (slot?.startTime && slot?.endTime) {
        applicableStartTime = String(slot.startTime).trim().slice(0, 5);
        applicableEndTime = String(slot.endTime).trim().slice(0, 5);
      }
    }

    const applicableTimeLabel = buildTimeRangeLabel(applicableStartTime, applicableEndTime);

    // Assemble variants
    const variants = variantRows.map((v) => ({
      id: v.id,
      nameVi: v.nameVi ?? '',
      nameEn: v.nameEn ?? null,
      nameKo: v.nameKo ?? null,
      durationMin: v.durationMin,
      pax: v.pax,
      descriptionVi: v.descriptionVi,
      sortOrder: v.sortOrder ?? 0,
      prices: priceRows
        .filter((p) => p.variantId === v.id)
        .map((p) => ({
          id: p.id,
          priceType: p.priceType ?? '',
          listPrice: p.listPrice ? parseFloat(String(p.listPrice)) : null,
          originalPrice: p.originalPrice ? parseFloat(String(p.originalPrice)) : null,
          salePrice: p.salePrice ? parseFloat(String(p.salePrice)) : null,
          currency: p.currency ?? row.currency ?? 'VND',
        })),
    }));

    // Photos: image-type media URLs; fallback to coverImageUrl
    const photos = mediaRows
      .filter((m) => m.mediaType === 'image' && m.mediaUrl)
      .map((m) => m.mediaUrl as string);
    if (photos.length === 0 && row.coverImageUrl) photos.push(row.coverImageUrl);

    // localizedSlug phải khai báo trước breadcrumbs vì breadcrumb dùng nó
    const localizedSlug =
      locale === 'en' ? (row.slugEn ?? canonicalDealSlug(row.slugVi, row.id))
        : locale === 'ko' ? (row.slugKo ?? canonicalDealSlug(row.slugVi, row.id))
          : canonicalDealSlug(row.slugVi, row.id);

    // Breadcrumbs — labels locale-aware
    const pickName = (vi: string | null, en: string | null | undefined, ko: string | null | undefined) =>
      locale === 'en' ? (en ?? vi ?? '') : locale === 'ko' ? (ko ?? vi ?? '') : (vi ?? '');

    const breadcrumbs: DealBreadcrumbItemDto[] = [{ label: 'Trang chủ', url: '/' }];
    if (row.serviceSlug && row.serviceNameVi) {
      breadcrumbs.push({
        label: pickName(row.serviceNameVi, row.serviceNameEn, row.serviceNameKo),
        url: `/${row.serviceSlug}`,
      });
    }
    if (row.serviceSlug && row.citySlug && row.cityName) {
      breadcrumbs.push({
        label: pickName(row.cityName, row.cityNameEn, row.cityNameKo),
        url: `/${row.serviceSlug}/${row.citySlug}`,
      });
    }
    if (row.serviceSlug && row.citySlug && row.districtSlug && row.districtName) {
      breadcrumbs.push({
        label: pickName(row.districtName, row.districtNameEn, row.districtNameKo),
        url: `/${row.serviceSlug}/${row.citySlug}/${row.districtSlug}`,
      });
    }
    // Deal item — localized title + slug
    breadcrumbs.push({
      label: pickDealDisplayTitle(
        {
          titleVi: row.titleVi,
          titleEn: row.titleEn,
          titleKo: row.titleKo,
          serviceNameVi: row.serviceNameVi,
          serviceNameEn: row.serviceNameEn,
          serviceNameKo: row.serviceNameKo,
          cityName: row.cityName,
          cityNameEn: row.cityNameEn,
          cityNameKo: row.cityNameKo,
        },
        locale,
      ),
      url: `/organization_services/${localizedSlug}`,
    });

    const flashCtx = await this.resolveFlashSaleWindow(new Date());
    const inFlashWindow = flashCtx.dealIds.includes(row.id);

    const [spaPhotoUrl, viewCount] = await Promise.all([
      row.spaId
        ? this.resolveSpaDisplayPhoto({
          spaId: row.spaId,
          spaAvatar: row.spaAvatar,
          spaPhotos: row.spaPhotos,
          googlePlaceId: row.googlePlaceId ?? null,
        })
        : Promise.resolve(null),
      this.tracking.getDealEngagementCount(row.slugVi, row.id),
    ]);

    // Resolve spa photos — top 5 signed URLs
    const spaLoc = (spaLocRows as Array<{ addressLine: string | null; cityName: string | null; cityNameEn: string | null; cityNameKo: string | null; districtName: string | null; districtNameEn: string | null; districtNameKo: string | null }>)[0];
    const spaDistrictName =
      locale === 'en' ? (spaLoc?.districtNameEn ?? spaLoc?.districtName ?? null)
        : locale === 'ko' ? (spaLoc?.districtNameKo ?? spaLoc?.districtName ?? null)
          : spaLoc?.districtName ?? null;

    // Resolve up to 5 signed gallery photos, fallback to resolvePhotos
    const galleryRows = spaGalleryRows as Array<{ imageUrl: unknown }>;
    let spaPhotos: string[];
    if (spaPhotoUrl) {
      // Avatar luôn là ảnh đầu tiên
      const signedGallery = (
        await Promise.all(galleryRows.slice(0, 4).map((g) => this.photoCache.toDisplayUrl(String(g.imageUrl ?? ''))))
      ).filter((u): u is string => Boolean(u));
      spaPhotos = [spaPhotoUrl, ...signedGallery].slice(0, 5);
    } else if (galleryRows.length > 0) {
      const signedGallery = (
        await Promise.all(galleryRows.map((g) => this.photoCache.toDisplayUrl(String(g.imageUrl ?? ''))))
      ).filter((u): u is string => Boolean(u));
      spaPhotos = signedGallery.length > 0
        ? signedGallery.slice(0, 5)
        : (await this.photoCache.resolvePhotos(spaId, row.spaPhotos, row.googlePlaceId ?? null)).slice(0, 5);
    } else {
      spaPhotos = (await this.photoCache.resolvePhotos(spaId, row.spaPhotos, row.googlePlaceId ?? null)).slice(0, 5);
    }

    // Assemble top 5 reviews
    const reviewRows = spaReviewRows as Array<{ id: number; authorName: string | null; rating: unknown; content: string | null; reviewedAt: Date | null }>;
    const spaReviews = reviewRows.map((r) => ({
      id: r.id,
      authorName: r.authorName ?? 'Anonymous',
      ratingValue: r.rating ? parseFloat(String(r.rating)) : 0,
      content: r.content ?? null,
      createdAt: r.reviewedAt?.toISOString() ?? null,
    }));

    const reportUrl = spaId ? `https://glowexplore.com/report?spaId=${spaId}` : null;

    const spa: SpaDetailForDealDto = {
      id: row.spaId ?? '',
      slug: row.spaSlug ?? '',
      name: row.spaName ?? '',
      description: row.spaDescription ?? null,
      ratingValue: row.spaRating ? parseFloat(String(row.spaRating)) : 0,
      reviewCount: row.spaReviewCount ?? 0,
      cityName:
        pickLocalizedText(
          { vi: row.cityName, en: row.cityNameEn, ko: row.cityNameKo },
          locale,
        ) || pickLocalizedText(
          { vi: spaLoc?.cityName ?? null, en: spaLoc?.cityNameEn ?? null, ko: spaLoc?.cityNameKo ?? null },
          locale,
        ) || row.cityName || spaLoc?.cityName || null,
      districtName: spaDistrictName,
      address: spaLoc?.addressLine ?? row.spaAddress ?? null,
      distanceKm: null,
      lat: row.spaLat ? parseFloat(String(row.spaLat)) : null,
      lng: row.spaLng ? parseFloat(String(row.spaLng)) : null,
      photoName: spaPhotoUrl,
      spaAvatarUrl: spaPhotoUrl ?? row.coverImageUrl ?? null,
      contact: {
        phone: row.spaPhone ?? null,
        zaloUrl: row.spaZalo ?? null,
        facebookUrl: row.spaFacebook ?? null,
        telegramUrl: row.spaTelegram ?? null,
        reportUrl,
      },
      photos: spaPhotos,
      reviews: spaReviews,
    };

    const otherDealRows = spaId
      ? await this.db
        .select({
          id: schema.deals.id,
          slugVi: schema.deals.slugVi,
          slugEn: schema.deals.slugEn,
          slugKo: schema.deals.slugKo,
          titleVi: schema.deals.titleVi,
          titleEn: schema.deals.titleEn,
          titleKo: schema.deals.titleKo,
          coverImageUrl: schema.deals.coverImageUrl,
          discountPercent: schema.deals.discountPercent,
          currency: schema.deals.currency,
          startAt: schema.deals.startAt,
          endAt: schema.deals.endAt,
          spaId: schema.deals.spaId,
          cityName: schema.cities.nameVi,
          cityNameEn: schema.cities.nameEn,
          cityNameKo: schema.cities.nameKo,
          serviceNameVi: schema.services.nameVi,
          serviceNameEn: schema.services.nameEn,
          serviceNameKo: schema.services.nameKo,
          salePrice: sql<string>`(
            SELECT dvp.sale_price::text
            FROM deal_variants dv
            JOIN deal_variant_prices dvp ON dvp.variant_id = dv.id AND dvp.is_active = true
            WHERE dv.deal_id = ${schema.deals.id}
            ORDER BY dvp.sale_price ASC NULLS LAST
            LIMIT 1
          )`,
          originalPrice: sql<string>`(
            SELECT dvp.original_price::text
            FROM deal_variants dv
            JOIN deal_variant_prices dvp ON dvp.variant_id = dv.id AND dvp.is_active = true
            WHERE dv.deal_id = ${schema.deals.id}
            ORDER BY dvp.sale_price ASC NULLS LAST
            LIMIT 1
          )`,
        })
        .from(schema.deals)
        .leftJoin(schema.cities, eq(schema.deals.cityId, schema.cities.id))
        .leftJoin(schema.services, eq(schema.deals.categoryId, schema.services.id))
        .where(
          and(
            eq(schema.deals.spaId, spaId),
            ne(schema.deals.id, dealId),
            eq(schema.deals.status, 'active'),
            dealWithinPublicationWindow(),
          ),
        )
        .limit(4)
      : [];

    const flashDealIdSet = new Set(flashCtx.dealIds);
    const otherDealsAtSpa = otherDealRows.map((r) =>
      this.buildDealCard(r as RawDealRow, spa, flashDealIdSet, locale),
    );

    return {
      id: row.id,
      slug: canonicalDealSlug(row.slugVi, row.id),
      canonicalSlug: localizedSlug,
      localizedSlugs: {
        vi: canonicalDealSlug(row.slugVi, row.id),
        en: row.slugEn ?? null,
        ko: row.slugKo ?? null,
      },
      viewCount,
      title: pickDealDisplayTitle(
        {
          titleVi: row.titleVi,
          titleEn: row.titleEn,
          titleKo: row.titleKo,
          serviceNameVi: row.serviceNameVi,
          serviceNameEn: row.serviceNameEn,
          serviceNameKo: row.serviceNameKo,
          cityName: row.cityName,
          cityNameEn: row.cityNameEn,
          cityNameKo: row.cityNameKo,
        },
        locale,
      ),
      shortDescription: localizedShortDescription,
      content: pickLocalizedDealText(
        locale,
        row.contentVi,
        row.contentEn,
        row.contentKo,
      ),
      coverImageUrl: row.coverImageUrl ?? null,
      photos,
      discountPercent: row.discountPercent ?? null,
      currency: row.currency ?? 'VND',
      ...buildDealScheduleFields(row.startAt, row.endAt),
      isFlashSale: inFlashWindow,
      flashSaleEndsAt:
        inFlashWindow && flashCtx.windowEndsAt ? flashCtx.windowEndsAt.toISOString() : null,
      isSoldOut: row.isSoldOut ?? false,
      applicableStartTime,
      applicableEndTime,
      applicableTimeLabel,
      serviceSlug: row.serviceSlug ?? null,
      breadcrumbs,
      spa,
      variants,
      media: mediaRows.map((m) => ({
        id: m.id,
        mediaUrl: m.mediaUrl ?? '',
        mediaType: m.mediaType ?? 'image',
        sortOrder: m.sortOrder ?? 0,
      })),
      otherDealsAtSpa,
    };
  }

  /** Flash-sale card row shape — giá lấy từ variant active (giống queryDealsRaw). */
  private flashDealRowSelect() {
    return {
      id: schema.deals.id,
      slugVi: schema.deals.slugVi,
      slugEn: schema.deals.slugEn,
      slugKo: schema.deals.slugKo,
      titleVi: schema.deals.titleVi,
      titleEn: schema.deals.titleEn,
      titleKo: schema.deals.titleKo,
      coverImageUrl: schema.deals.coverImageUrl,
      discountPercent: schema.deals.discountPercent,
      currency: schema.deals.currency,
      startAt: schema.deals.startAt,
      endAt: schema.deals.endAt,
      spaId: schema.deals.spaId,
      cityId: schema.deals.cityId,
      districtId: schema.deals.districtId,
      salePrice: sql<string>`(
          SELECT dvp.sale_price::text
          FROM deal_variants dv
          JOIN deal_variant_prices dvp ON dvp.variant_id = dv.id AND dvp.is_active = true
          WHERE dv.deal_id = ${schema.deals.id}
          ORDER BY dvp.sale_price ASC NULLS LAST
          LIMIT 1
        )`,
      originalPrice: sql<string>`(
          SELECT dvp.original_price::text
          FROM deal_variants dv
          JOIN deal_variant_prices dvp ON dvp.variant_id = dv.id AND dvp.is_active = true
          WHERE dv.deal_id = ${schema.deals.id}
          ORDER BY dvp.sale_price ASC NULLS LAST
          LIMIT 1
        )`,
      spaSlug: schema.spas.slug,
      spaName: schema.spas.name,
      spaRating: schema.spas.ratingValue,
      spaReviewCount: schema.spas.reviewCount,
      spaPhotos: schema.spas.photos,
      spaAvatar: schema.spas.spaAvatar,
      spaLat: schema.spas.latitude,
      spaLng: schema.spas.longitude,
      googlePlaceId: schema.spas.googlePlaceId,
      cityName: schema.cities.nameVi,
      cityNameEn: schema.cities.nameEn,
      cityNameKo: schema.cities.nameKo,
      serviceNameVi: schema.services.nameVi,
      serviceNameEn: schema.services.nameEn,
      serviceNameKo: schema.services.nameKo,
      spaOpeningHours: schema.spas.openingHours,
    } as const;
  }

  /**
   * Flash sale home: cùng khung giờ áp dụng 60–120 phút, tối đa 10 cửa hàng,
   * mỗi spa 1 deal (Deep discount = % cao nhất của spa trong khung), sort spa theo % giảm dần.
   * Countdown = kết thúc khung (slot end trong ngày hoặc end_at nhóm campaign).
   */
  async getFlashSale(
    opts: { locale?: DealLocale; lat?: number; lng?: number; radiusKm?: number } = {},
    shared?: { flashSaleWindow?: FlashSaleWindowState },
  ): Promise<FlashSaleDto> {
    const { locale, lat, lng, radiusKm } = opts;
    const now = new Date();
    try {
      const ctx = shared?.flashSaleWindow ?? (await this.resolveFlashSaleWindow(now));

      if (ctx.mode === 'none' || !ctx.dealIds.length) {
        return {
          deals: [],
          endsAt: null,
          startsAt: null,
          isActive: false,
          countdownSeconds: null,
          windowLabel: null,
          applicableDurationMinutes: null,
        };
      }

      const hasGeo = Number.isFinite(lat) && Number.isFinite(lng);
      const radius = radiusKm ?? 50;

      let rows = await this.queryFlashDealsByDealIds(ctx.dealIds);

      // Geo filter: keep only spas within radiusKm of user
      if (hasGeo) {
        rows = rows.filter((row) => {
          const sLat = row.spaLat ? parseFloat(row.spaLat) : null;
          const sLng = row.spaLng ? parseFloat(row.spaLng) : null;
          if (sLat === null || sLng === null) return false;
          return haversineKm(lat!, lng!, sLat, sLng) <= radius;
        });
      }

      const bySpa = new Map<string, RawDealRow>();
      for (const row of rows) {
        const sid = row.spaId ?? '';
        const prev = bySpa.get(sid);
        const d = parseDiscountPercent(row.discountPercent);
        if (!prev || d > parseDiscountPercent(prev.discountPercent)) {
          bySpa.set(sid, row);
        }
      }

      const sorted = [...bySpa.values()].sort(
        (a, b) => parseDiscountPercent(b.discountPercent) - parseDiscountPercent(a.discountPercent),
      );
      const top = sorted.slice(0, FLASH_HOME_TOP_SPAS);

      const flashIdSet = new Set(ctx.dealIds);
      const topRows = top as RawDealRow[];
      const flashEngagementEntries = topRows
        .filter((r) => r.spaId && r.spaSlug)
        .map((r) => ({ spaId: r.spaId!, slug: r.spaSlug! }));
      const [viewBySlugFlash, photoBySpaFlash] = await Promise.all([
        this.tracking.batchSpaDisplayEngagement(flashEngagementEntries),
        this.batchSpaDisplayPhotos(topRows),
      ]);
      const cards = topRows.map((row) => {
        const slug = row.spaSlug ?? '';
        const vc = viewBySlugFlash.get(slug) ?? 0;
        const pid = row.spaId ?? '';
        const photoUrl = pid ? (photoBySpaFlash.get(pid) ?? null) : null;
        const spa = this.buildSpaBasic(row, hasGeo ? lat : undefined, hasGeo ? lng : undefined, {
          viewCount: vc,
          photoUrl,
          locale,
        });
        return this.buildDealCard(row, spa, flashIdSet, locale, true);
      });

      const endsAt = ctx.windowEndsAt;
      const startsAt = ctx.windowStartsAt;
      const countdownSeconds = endsAt
        ? Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / 1000))
        : null;

      this.logger.debug(
        `flash-sale ok mode=${ctx.mode} dealIds=${ctx.dealIds.length} rows=${rows.length} spas=${bySpa.size} cards=${cards.length} hasGeo=${hasGeo}`,
      );

      return {
        deals: cards,
        endsAt: endsAt?.toISOString() ?? null,
        startsAt: startsAt?.toISOString() ?? null,
        isActive: cards.length > 0,
        countdownSeconds,
        windowLabel: ctx.windowLabel,
        applicableDurationMinutes: ctx.applicableDurationMinutes,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `flash-sale failed locale=${locale ?? 'vi'} lat=${lat ?? 'null'} lng=${lng ?? 'null'} radiusKm=${radiusKm ?? 'null'}: ${msg}`,
        stack,
      );
      throw error;
    }
  }
}
