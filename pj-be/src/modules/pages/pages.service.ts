import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';
import { DealsService, PLACE_SEO_HUB_RADIUS_KM } from '../deals/deals.service';
import { LocationsService } from '../locations/locations.service';
import { ServicesService, LEGACY_PARENT_SERVICE_ID_MAP } from '../services/services.service';
import { UrlResolverService } from '../url-resolver/url-resolver.service';
import { SeoTemplateService } from '../seo/seo-template.service';
import { DealsQueryDto, DealLocale, DealSortOrder } from '../deals/dto/deals-query.dto';
import { ServiceResponseDto } from '../services/dto/service-response.dto';
import { CityResponseDto } from '../locations/dto/city-response.dto';
import { DistrictResponseDto } from '../locations/dto/district-response.dto';
import { PlaceResponseDto } from '../locations/dto/place-response.dto';
import { WardResponseDto } from '../locations/dto/ward-response.dto';
import {
  BreadcrumbItemDto,
  PageFiltersDto,
  PagePayloadDto,
  SeoMetaDto,
} from './dto/page-payload.dto';
import { buildPaginationMeta } from '../../common/dto/pagination.dto';
import { stripVietnameseAccents } from '../../common/utils/deal-localization.util';
import { PageLocale, PageResolveQueryDto } from './dto/page-resolve-query.dto';

/** PageLocale và DealLocale cùng bộ vi/en/ko — map rõ ràng cho getDeals / getFlashSale. */
function dealLocaleFromPage(locale: PageLocale): DealLocale {
  if (locale === PageLocale.EN) return 'en';
  if (locale === PageLocale.KO) return 'ko';
  return 'vi';
}
import {
  PageType,
  ResolvedPageContext,
  SeoNodeRow,
} from '../url-resolver/dto/resolved-context';

// ─── Locale helpers ───────────────────────────────────────────────────────────

function getLocaleName(
  obj: { nameVi: string; nameEn: string | null; nameKo: string | null } | null,
  locale: PageLocale,
): string {
  if (!obj) return '';
  if (locale === PageLocale.EN) return obj.nameEn ?? obj.nameVi;
  if (locale === PageLocale.KO) return obj.nameKo ?? obj.nameVi;
  return obj.nameVi;
}

// ─── targetUrl builder ────────────────────────────────────────────────────────

function buildTargetUrl(
  locale: PageLocale,
  serviceSlug: string | null | undefined,
  citySlug: string | null | undefined,
  districtSlug?: string | null,
): string | null {
  const prefix = `/${locale}`;
  if (serviceSlug) {
    if (districtSlug && citySlug) return `${prefix}/${serviceSlug}-${districtSlug}-${citySlug}`;
    if (citySlug) return `${prefix}/${serviceSlug}-${citySlug}`;
    return `${prefix}/${serviceSlug}`;
  }
  if (citySlug) return `${prefix}/${citySlug}`;
  return null;
}

function buildLocalizedPageSlugs(
  service: ServiceResponseDto | null,
  citySlug: string | null,
  districtSlug: string | null,
  wardSlug: string | null,
): { vi: string; en: string; ko: string } | null {
  if (!service) return null;
  const compose = (locale: PageLocale, prefix: string) => {
    const parts = [prefix, wardSlug, districtSlug, citySlug].filter(Boolean);
    return `/${locale}/${parts.join('-')}`;
  };
  const viPrefix = (service.slugVi ?? service.slugGlobal).toLowerCase();
  const enPrefix = (service.slugEn ?? service.slugGlobal).toLowerCase();
  const koPrefix = (service.slugKo ?? service.slugGlobal).toLowerCase();
  return {
    vi: compose(PageLocale.VI, viPrefix),
    en: compose(PageLocale.EN, enPrefix),
    ko: compose(PageLocale.KO, koPrefix),
  };
}

/** Prefix slug URL theo locale. */
function serviceUrlPrefixes(s: ServiceResponseDto, locale: PageLocale): string[] {
  const out: string[] = [];
  if (locale === PageLocale.VI && s.slugVi) out.push(s.slugVi.toLowerCase());
  if (locale === PageLocale.EN && s.slugEn) out.push(s.slugEn.toLowerCase());
  if (locale === PageLocale.KO && s.slugKo) out.push(s.slugKo.toLowerCase());
  out.push(s.slugGlobal.toLowerCase());
  return [...new Set(out.filter(Boolean))];
}

/**
 * Parse path phẳng kiểu massage-binh-duong / massage-cau-giay-ha-noi khi không có seo_node (not_found).
 */
function parseFlatSeoUrl(
  rawUrl: string,
  locale: PageLocale,
  allServices: ServiceResponseDto[],
  allCities: CityResponseDto[],
): {
  service: ServiceResponseDto | null;
  city: CityResponseDto | null;
  districtSlug: string | null;
} {
  const normalized = rawUrl.replace(/^\//, '').toLowerCase().trim().replace(/\/+$/, '');
  const empty = { service: null as ServiceResponseDto | null, city: null as CityResponseDto | null, districtSlug: null as string | null };
  if (!normalized) return empty;

  type Cand = { service: ServiceResponseDto; prefix: string };
  const candidates: Cand[] = [];
  for (const s of allServices) {
    for (const prefix of serviceUrlPrefixes(s, locale)) {
      candidates.push({ service: s, prefix });
    }
  }
  candidates.sort((a, b) => b.prefix.length - a.prefix.length);

  const citySortedEarly = [...allCities].sort((a, b) => b.slug.length - a.slug.length);
  for (const c of citySortedEarly) {
    if (normalized === c.slug.toLowerCase()) {
      return { service: null, city: c, districtSlug: null };
    }
  }

  for (const { service, prefix } of candidates) {
    if (normalized === prefix) {
      return { service, city: null, districtSlug: null };
    }
    if (!normalized.startsWith(`${prefix}-`)) continue;
    const remainder = normalized.slice(prefix.length + 1);
    if (!remainder) return { service, city: null, districtSlug: null };

    const citySorted = [...allCities].sort((a, b) => b.slug.length - a.slug.length);
    for (const city of citySorted) {
      const cs = city.slug.toLowerCase();
      if (remainder === cs) {
        return { service, city, districtSlug: null };
      }
      if (remainder.endsWith(`-${cs}`)) {
        const districtPart = remainder.slice(0, remainder.length - cs.length - 1);
        if (districtPart.length > 0) {
          return { service, city, districtSlug: districtPart };
        }
      }
    }
  }

  return empty;
}

// ─── SEO meta ─────────────────────────────────────────────────────────────────

interface SeoContext {
  pageType: string;
  service: ServiceResponseDto | null;
  city: CityResponseDto | null;
  district: DistrictResponseDto | null;
  ward: WardResponseDto | null;
  locale: PageLocale;
  dealCount: number;
}

/** /deals hub — no seo_node row. */
function buildDealsHubSeo(locale: PageLocale, dealCount: number): SeoMetaDto {
  const homeLabel =
    locale === PageLocale.EN ? 'Home' : locale === PageLocale.KO ? '홈' : 'Trang chủ';
  const brand = 'Glow Explore';
  if (locale === PageLocale.EN) {
    const h1 = 'Spa & beauty deals';
    return {
      h1,
      title: `${h1} | ${brand}`,
      metaDescription: `${dealCount}+ curated spa and beauty deals nationwide — compare prices on ${brand}.`,
      breadcrumbs: [
        { label: homeLabel, url: '/' },
        { label: 'Deals', url: '/deals' },
      ],
      indexable: dealCount >= 1,
    };
  }
  if (locale === PageLocale.KO) {
    const h1 = '스파·뷰티 딜';
    return {
      h1,
      title: `${h1} | ${brand}`,
      metaDescription: `전국 ${dealCount}개 이상의 스파·뷰티 딜을 ${brand}에서 비교하고 예약하세요.`,
      breadcrumbs: [
        { label: homeLabel, url: '/' },
        { label: 'Deals', url: '/deals' },
      ],
      indexable: dealCount >= 1,
    };
  }
  const h1 = 'Ưu đãi spa & làm đẹp';
  return {
    h1,
    title: `${h1} | ${brand}`,
    metaDescription: `${dealCount}+ deal spa & làm đẹp trên khắp cả nước — so sánh giá tại ${brand}.`,
    breadcrumbs: [
      { label: homeLabel, url: '/' },
      { label: 'Deals', url: '/deals' },
    ],
    indexable: dealCount >= 1,
  };
}

function buildBreadcrumbs(ctx: SeoContext): BreadcrumbItemDto[] {
  const homeLabel =
    ctx.locale === PageLocale.EN ? 'Home' : ctx.locale === PageLocale.KO ? '홈' : 'Trang chủ';
  const crumbs: BreadcrumbItemDto[] = [{ label: homeLabel, url: '/' }];
  const loc = ctx.locale;
  const base = `/${loc}`;

  if (ctx.service) {
    const seg = pathSegmentForService(ctx.service, loc);
    crumbs.push({
      label: getLocaleName(ctx.service, loc),
      url: `${base}/${seg}`,
    });
  }

  if (ctx.city) {
    const url = ctx.service
      ? `${base}/${pathSegmentForService(ctx.service, loc)}-${ctx.city.slug}`
      : `${base}/${ctx.city.slug}`;
    crumbs.push({
      label: getLocaleName(ctx.city, loc),
      url,
    });
  }

  if (ctx.district && ctx.city) {
    const url = ctx.service
      ? `${base}/${pathSegmentForService(ctx.service, loc)}-${ctx.district.slug}-${ctx.city.slug}`
      : `${base}/${ctx.district.slug}-${ctx.city.slug}`;
    crumbs.push({
      label: getLocaleName(ctx.district, loc),
      url,
    });
  }

  return crumbs;
}

function pathSegmentForService(service: ServiceResponseDto, loc: PageLocale): string {
  if (loc === PageLocale.VI) return (service.slugVi ?? service.slugGlobal).toLowerCase();
  if (loc === PageLocale.EN) return (service.slugEn ?? service.slugGlobal).toLowerCase();
  return (service.slugKo ?? service.slugGlobal).toLowerCase();
}

/** Hub chỉ slug thành phố, không có seo_node (vd `/vi/ho-chi-minh`). */
function buildCityOnlySeo(locale: PageLocale, city: CityResponseDto, dealCount: number): SeoMetaDto {
  const homeLabel =
    locale === PageLocale.EN ? 'Home' : locale === PageLocale.KO ? '홈' : 'Trang chủ';
  const brand = 'Glow Explore';
  const cityName = getLocaleName(city, locale);
  const locPath = locale;
  const cityUrl = `/${locPath}/${city.slug}`;

  if (locale === PageLocale.EN) {
    const h1 = `Spa & beauty deals — ${cityName}`;
    return {
      h1,
      title: `${h1} | ${brand}`,
      metaDescription: `${dealCount}+ spa and beauty deals in ${cityName} — compare on ${brand}.`,
      breadcrumbs: [
        { label: homeLabel, url: '/' },
        { label: cityName, url: cityUrl },
      ],
      indexable: dealCount >= 3,
      slugByLocale: { vi: `/vi/${city.slug}`, en: `/en/${city.slug}`, ko: `/ko/${city.slug}` },
    };
  }
  if (locale === PageLocale.KO) {
    const h1 = `${cityName} 스파·뷰티 딜`;
    return {
      h1,
      title: `${h1} | ${brand}`,
      metaDescription: `${cityName} 스파·뷰티 딜 ${dealCount}개 이상 — ${brand}에서 비교하세요.`,
      breadcrumbs: [
        { label: homeLabel, url: '/' },
        { label: cityName, url: cityUrl },
      ],
      indexable: dealCount >= 3,
      slugByLocale: { vi: `/vi/${city.slug}`, en: `/en/${city.slug}`, ko: `/ko/${city.slug}` },
    };
  }
  const h1 = `Ưu đãi spa & làm đẹp — ${cityName}`;
  return {
    h1,
    title: `${h1} | ${brand}`,
    metaDescription: `${dealCount}+ deal spa & làm đẹp — ${cityName}. So sánh giá trên ${brand}.`,
    breadcrumbs: [
      { label: homeLabel, url: '/' },
      { label: cityName, url: cityUrl },
    ],
    indexable: dealCount >= 3,
    slugByLocale: { vi: `/vi/${city.slug}`, en: `/en/${city.slug}`, ko: `/ko/${city.slug}` },
  };
}

function buildFlashSaleHubSeo(locale: PageLocale, dealCount: number): SeoMetaDto {
  const homeLabel =
    locale === PageLocale.EN ? 'Home' : locale === PageLocale.KO ? '홈' : 'Trang chủ';
  const h1 =
    locale === PageLocale.EN ? 'Flash sale' : locale === PageLocale.KO ? '플래시 세일' : 'Flash sale';
  const metaDescription =
    locale === PageLocale.EN
      ? `${dealCount}+ limited-time spa and beauty deals.`
      : locale === PageLocale.KO
        ? `${dealCount}개 이상의 한정 타임 딜.`
        : `${dealCount}+ ưu đãi flash sale — giá tốt trong thời gian có hạn.`;

  return {
    h1,
    title: `${h1} | Glow Explore`,
    metaDescription,
    breadcrumbs: [
      { label: homeLabel, url: '/' },
      { label: h1, url: '/flash-sale' },
    ],
    indexable: dealCount >= 1,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly dealsService: DealsService,
    private readonly locationsService: LocationsService,
    private readonly servicesService: ServicesService,
    private readonly urlResolverService: UrlResolverService,
    private readonly seoTemplateService: SeoTemplateService,
  ) {}

  private async buildSeoMetaAsync(ctx: SeoContext, node: SeoNodeRow | null): Promise<SeoMetaDto> {
    const localeCode = ctx.locale === PageLocale.EN ? 'en' : ctx.locale === PageLocale.KO ? 'ko' : 'vi';
    const pageKind: 'category' | 'city' | 'district' =
      ctx.pageType === 'city' ? 'city' : ctx.pageType === 'district' ? 'district' : 'category';
    const rendered = await this.seoTemplateService.composePageSeo(
      {
        locale: localeCode,
        dealCount: ctx.dealCount,
        spaCount: node?.spaCount ?? null,
        seoNode: node,
        entities: {
          serviceName: getLocaleName(ctx.service, ctx.locale),
          cityName:
            ctx.locale === PageLocale.EN && ctx.city?.nameVi
              ? stripVietnameseAccents(ctx.city.nameVi)
              : getLocaleName(ctx.city, ctx.locale),
          districtName:
            ctx.locale === PageLocale.EN && ctx.district?.nameVi
              ? stripVietnameseAccents(ctx.district.nameVi)
              : getLocaleName(ctx.district, ctx.locale),
          wardName:
            ctx.locale === PageLocale.EN && ctx.ward?.nameVi
              ? stripVietnameseAccents(ctx.ward.nameVi)
              : getLocaleName(ctx.ward, ctx.locale),
        },
      },
      pageKind,
    );
    return {
      ...rendered,
      breadcrumbs: buildBreadcrumbs(ctx),
      indexable: node?.indexable ?? ctx.dealCount >= 3,
    };
  }

  private async getPlacesByGeo(opts: {
    cityId?: number | null;
    districtId?: number | null;
    wardId?: number | null;
  }): Promise<PlaceResponseDto[]> {
    if (!opts.cityId && !opts.districtId && !opts.wardId) return [];
    const conds = [eq(schema.places.isActive, true)];
    if (opts.cityId) conds.push(eq(schema.places.cityId, opts.cityId));
    if (opts.districtId) conds.push(eq(schema.places.districtId, opts.districtId));
    if (opts.wardId) conds.push(eq(schema.places.wardId, opts.wardId));

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
        lat: schema.places.lat,
        lng: schema.places.lng,
      })
      .from(schema.places)
      .where(and(...conds))
      .orderBy(schema.places.priority);

    return rows.map((r) => {
      const latN = r.lat != null ? Number.parseFloat(String(r.lat)) : null;
      const lngN = r.lng != null ? Number.parseFloat(String(r.lng)) : null;
      return {
        id: r.id,
        slug: r.slug ?? '',
        nameVi: r.nameVi ?? '',
        nameEn: r.nameEn ?? null,
        nameKo: r.nameKo ?? null,
        cityId: r.cityId ?? null,
        districtId: r.districtId ?? null,
        wardId: r.wardId ?? null,
        lat: latN != null && Number.isFinite(latN) ? latN : null,
        lng: lngN != null && Number.isFinite(lngN) ? lngN : null,
      };
    });
  }

  async resolvePage(query: PageResolveQueryDto): Promise<PagePayloadDto> {
    const locale = query.locale ?? PageLocale.VI;

    // ── Resolve URL → entity IDs via seo_nodes ──────────────────────────────
    const context = await this.urlResolverService.resolve(query.url, locale);

    if (context.pageType === 'not_found') {
      const [allServices, allActiveServices, { data: allCities }] = await Promise.all([
        this.servicesService.getServices(),
        this.servicesService.getAllServices(),
        this.locationsService.getCities({ page: 1, limit: 200 }),
      ]);
      return await this.buildNotFoundPayload(
        query.url,
        locale,
        allServices as any,
        allActiveServices as any,
        allCities as any,
        query.place_slug,
      );
    }

    // ── Load filters + flash snapshot song song (flash không phụ thuộc cities/services) ──
    const [
      [allServices, { data: allCities }],
      flashWin,
    ] = await Promise.all([
      Promise.all([
        this.servicesService.getServices(),
        this.locationsService.getCities({ page: 1, limit: 200 }),
      ]),
      this.dealsService.snapshotFlashSaleWindow(),
    ]);

    // ── Resolve current entities by ID ──────────────────────────────────────
    let originalService: ServiceResponseDto | null = null;
    if (context.categoryId) {
      originalService =
        allServices.find((s) => s.id === context.categoryId) ??
        (await this.servicesService.getServiceById(context.categoryId));
    }

    const targetCategoryId = context.categoryId
      ? (LEGACY_PARENT_SERVICE_ID_MAP[context.categoryId] ?? context.categoryId)
      : null;

    const parentGroupService = targetCategoryId
      ? (allServices.find((s) => s.id === targetCategoryId) ?? null)
      : null;

    const currentService = originalService ?? parentGroupService;
    const fallbackParentId =
      parentGroupService?.id ??
      (currentService?.categoryId
        ? (LEGACY_PARENT_SERVICE_ID_MAP[currentService.categoryId] ?? currentService.categoryId)
        : currentService?.id ?? null);

    const parentGroupId = fallbackParentId;

    const subServicesP = fallbackParentId
      ? this.servicesService.getSubServices(fallbackParentId)
      : Promise.resolve([] as ServiceResponseDto[]);

    const currentCity = context.cityId
      ? (allCities.find((c) => c.id === context.cityId) ?? null)
      : null;

    let currentDistrict: DistrictResponseDto | null = null;
    let districts: DistrictResponseDto[] | null = null;
    let wards: WardResponseDto[] | null = null;
    let currentWard: WardResponseDto | null = null;
    let places: PlaceResponseDto[] | null = null;
    let currentPlace: PlaceResponseDto | null = null;

    const districtsP = currentCity
      ? this.locationsService.getDistrictsByCitySlug(currentCity.slug)
      : Promise.resolve({
          data: [] as DistrictResponseDto[],
          meta: buildPaginationMeta(1, 20, 0),
        });

    const districtsResult = await districtsP;

    if (currentCity) {
      districts = districtsResult.data;
      if (context.districtId) {
        currentDistrict = districts.find((d) => d.id === context.districtId) ?? null;
        if (currentDistrict) {
          const wardsResult = await this.locationsService.getWardsByDistrictSlug(currentDistrict.slug);
          wards = wardsResult.data;
          if (context.wardId) {
            currentWard = wards.find((w) => w.id === context.wardId) ?? null;
          }
        }
      }
    }

    const geoArgs = {
      cityId: currentCity?.id,
      districtId: currentDistrict?.id,
      wardId: currentWard?.id ?? context.wardId ?? null,
    };

    const loadPlacesList =
      !!query.place_slug ||
      context.seoNode?.placeId != null ||
      context.seoNode?.nodeType === 'place';

    places = loadPlacesList ? await this.getPlacesByGeo(geoArgs) : [];

    const placeIdFromSeo =
      context.seoNode?.placeId != null ? Number(context.seoNode.placeId) : null;
    currentPlace = placeIdFromSeo
      ? (places.find((p) => p.id === placeIdFromSeo) ?? null)
      : query.place_slug
        ? (places.find((p) => p.slug.toLowerCase() === query.place_slug!.toLowerCase()) ?? null)
        : null;

    const pageNum = query.page ?? 1;

    const isPlaceSeoHub = context.seoNode?.nodeType === 'place';
    const phLat = currentPlace?.lat ?? null;
    const phLng = currentPlace?.lng ?? null;
    const usePlaceHubGeo =
      isPlaceSeoHub &&
      phLat != null &&
      phLng != null &&
      Number.isFinite(phLat) &&
      Number.isFinite(phLng);

    // ── Fetch deals ─────────────────────────────────────────────────────────
    const dealLocale = dealLocaleFromPage(locale);
    const dealsQuery: DealsQueryDto = {
      city_slug: currentCity?.slug,
      district_slug: currentDistrict?.slug,
      ward_slug: currentWard?.slug,
      place_slug: usePlaceHubGeo ? undefined : (currentPlace?.slug ?? query.place_slug),
      service_slug: currentService?.slugGlobal,
      service_code: currentService?.code,
      sort:
        query.sort ??
        (usePlaceHubGeo || (query.lat && query.lng)
          ? DealSortOrder.DISTANCE
          : DealSortOrder.RATING),
      lat: usePlaceHubGeo ? phLat! : query.lat,
      lng: usePlaceHubGeo ? phLng! : query.lng,
      page: pageNum,
      limit: query.limit ?? 20,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      minRating: query.minRating,
      isOpenNow: query.isOpenNow,
      locale: dealLocale,
      ...(context.flashSaleHub ? { flash_sale_only: true as const } : {}),
    };

    /** Chip khu vực: chỉ trang 1 (infinite scroll không cần đếm lại — giảm latency). */
    const needsChipRecount = !!(context.flashSaleHub || currentService) && pageNum === 1;
    /** Đã vào URL theo thành phố → không cần đếm lại chip 63 tỉnh (query nặng); dùng dealCount từ locations. */
    const needsCityChipRecount = needsChipRecount && !currentCity;
    /** Trong thành phố → đếm deal/quận để chip quận khớp list. */
    const needsDistrictChipRecount = needsChipRecount && !!currentCity?.slug;
    const chipOpts = {
      flashDealIds:
        context.flashSaleHub && flashWin.dealIds.length ? flashWin.dealIds : undefined,
      serviceSlug: currentService?.slugGlobal,
      serviceCode: currentService?.code,
    };

    const chipPairP =
      needsCityChipRecount || needsDistrictChipRecount
        ? (async (): Promise<[Map<number, number>, Map<number, number>]> => {
            try {
              const cityP = needsCityChipRecount
                ? this.dealsService.countDealsPerCityForRegionChips(chipOpts)
                : Promise.resolve(new Map<number, number>());
              const distP = needsDistrictChipRecount
                ? this.dealsService.countDealsPerDistrictForRegionChips(currentCity!.slug, chipOpts)
                : Promise.resolve(new Map<number, number>());
              return await Promise.all([cityP, distP]);
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              this.logger.warn(`region chip count failed, using locations.dealCount fallback: ${msg}`);
              return [
                new Map(allCities.map((c) => [c.id, 0])),
                new Map((districts ?? []).map((d) => [d.id, 0])),
              ];
            }
          })()
        : Promise.resolve([new Map<number, number>(), new Map<number, number>()] as [Map<number, number>, Map<number, number>]);

    // Giảm peak connection: getDeals trước (nặng nhất), flash + chip song song sau (cùng pool, ít slot hơn).
    const tResolveData = Date.now();
    const dealsResult = await this.dealsService.getDeals(dealsQuery, {
      flashSaleWindow: flashWin,
      ...(usePlaceHubGeo
        ? { placeHubGeo: { lat: phLat!, lng: phLng!, radiusKm: PLACE_SEO_HUB_RADIUS_KM } }
        : {}),
    });
    const [flashSale, chipPair, rawSubServices] = await Promise.all([
      this.dealsService.getFlashSale({ locale: dealLocale }, { flashSaleWindow: flashWin }),
      chipPairP,
      subServicesP,
    ]);
    this.logger.debug(`pages.resolve profile deals+flash+chipsMs=${Date.now() - tResolveData}ms`);

    const [byCityDealCount, byDistrictDealCount] = chipPair;

    const citiesForFilters = needsCityChipRecount
      ? allCities.map((c) => ({ ...c, dealCount: byCityDealCount.get(c.id) ?? 0 }))
      : allCities;
    const districtsForFilters =
      needsDistrictChipRecount && districts?.length
        ? districts.map((d) => ({ ...d, dealCount: byDistrictDealCount.get(d.id) ?? 0 }))
        : districts;

    // ── Build SEO meta ──────────────────────────────────────────────────────
    const seoCtx: SeoContext = {
      pageType: context.pageType,
      service: currentService,
      city: currentCity,
      district: currentDistrict,
      ward: currentWard,
      locale,
      dealCount: dealsResult.meta.total,
    };

    const seoMeta = context.flashSaleHub
      ? buildFlashSaleHubSeo(locale, dealsResult.meta.total)
      : !context.seoNode && currentCity && !currentService
        ? buildCityOnlySeo(locale, currentCity, dealsResult.meta.total)
        : !context.seoNode
          ? buildDealsHubSeo(locale, dealsResult.meta.total)
          : await this.buildSeoMetaAsync(seoCtx, context.seoNode);

    const slugByLocale = buildLocalizedPageSlugs(
      currentService,
      currentCity?.slug ?? null,
      currentDistrict?.slug ?? null,
      currentWard?.slug ?? null,
    );
    if (slugByLocale) {
      seoMeta.slugByLocale = slugByLocale;
    }

    // ── Assemble filters with targetUrl ─────────────────────────────────────
    const svcSlug =
      locale === PageLocale.VI
        ? (currentService?.slugVi ?? currentService?.slugGlobal ?? null)
        : locale === PageLocale.EN
          ? (currentService?.slugEn ?? currentService?.slugGlobal ?? null)
          : (currentService?.slugKo ?? currentService?.slugGlobal ?? null);
    const ctSlug = currentCity?.slug ?? null;

    const filters: PageFiltersDto = {
      services: allServices.map((s) => ({
        ...s,
        targetUrl: buildTargetUrl(
          locale,
          locale === PageLocale.VI
            ? (s.slugVi ?? s.slugGlobal)
            : locale === PageLocale.EN
              ? (s.slugEn ?? s.slugGlobal)
              : (s.slugKo ?? s.slugGlobal),
          ctSlug,
        ),
      })),
      currentService,
      parentGroupId,
      subServices: rawSubServices.map((s) => ({
        ...s,
        targetUrl: buildTargetUrl(
          locale,
          locale === PageLocale.VI
            ? (s.slugVi ?? s.slugGlobal)
            : locale === PageLocale.EN
              ? (s.slugEn ?? s.slugGlobal)
              : (s.slugKo ?? s.slugGlobal),
          ctSlug,
        ),
      })),
      cities: citiesForFilters.map((c) => ({
        ...c,
        targetUrl: buildTargetUrl(locale, svcSlug, c.slug),
      })),
      currentCity,
      districts: districtsForFilters
        ? districtsForFilters.map((d) => ({
            ...d,
            targetUrl: buildTargetUrl(locale, svcSlug, ctSlug, d.slug),
          }))
        : null,
      currentDistrict,
      wards,
      currentWard,
      places,
      currentPlace,
    };

    return {
      pageType: context.pageType,
      flashSaleHub: !!context.flashSaleHub,
      seoMeta,
      deals: dealsResult,
      flashSale,
      filters,
    };
  }

  // ─── not_found payload ────────────────────────────────────────────────────

  private async buildNotFoundPayload(
    rawUrl: string,
    locale: PageLocale,
    allServices: ServiceResponseDto[],
    allActiveServices: ServiceResponseDto[],
    allCities: CityResponseDto[],
    placeSlug?: string,
  ): Promise<PagePayloadDto> {
    const homeLabel =
      locale === PageLocale.EN ? 'Home' : locale === PageLocale.KO ? '홈' : 'Trang chủ';
    const parsed = parseFlatSeoUrl(rawUrl, locale, allActiveServices, allCities);
    const flashSale = await this.dealsService.getFlashSale({ locale: dealLocaleFromPage(locale) });

    let districts: DistrictResponseDto[] | null = null;
    let currentDistrict: DistrictResponseDto | null = null;
    let places: PlaceResponseDto[] | null = null;
    if (parsed.city) {
      const districtsResult = await this.locationsService.getDistrictsByCitySlug(parsed.city.slug);
      districts = districtsResult.data;
      if (parsed.districtSlug && districts?.length) {
        const ds = parsed.districtSlug.toLowerCase();
        currentDistrict = districts.find((d) => d.slug.toLowerCase() === ds) ?? null;
      }
      places = await this.getPlacesByGeo({
        cityId: parsed.city.id,
        districtId: currentDistrict?.id,
      });
    }

    const ctSlug = parsed.city?.slug ?? null;
    const svcSlug =
      locale === PageLocale.VI
        ? (parsed.service?.slugVi ?? parsed.service?.slugGlobal ?? null)
        : locale === PageLocale.EN
          ? (parsed.service?.slugEn ?? parsed.service?.slugGlobal ?? null)
          : (parsed.service?.slugKo ?? parsed.service?.slugGlobal ?? null);
    const parentServiceId = parsed.service
      ? (parsed.service.categoryId
        ? (LEGACY_PARENT_SERVICE_ID_MAP[parsed.service.categoryId] ?? parsed.service.categoryId)
        : parsed.service.id)
      : null;

    const parentGroupId = parentServiceId;

    const rawSubServices = parentServiceId
      ? await this.servicesService.getSubServices(parentServiceId)
      : [];

    const subServices = rawSubServices.map((s) => ({
      ...s,
      targetUrl: buildTargetUrl(
        locale,
        locale === PageLocale.VI
          ? (s.slugVi ?? s.slugGlobal)
          : locale === PageLocale.EN
            ? (s.slugEn ?? s.slugGlobal)
            : (s.slugKo ?? s.slugGlobal),
        ctSlug,
      ),
    }));

    const filters: PageFiltersDto = {
      services: allServices.map((s) => ({
        ...s,
        targetUrl: buildTargetUrl(
          locale,
          locale === PageLocale.VI
            ? (s.slugVi ?? s.slugGlobal)
            : locale === PageLocale.EN
              ? (s.slugEn ?? s.slugGlobal)
              : (s.slugKo ?? s.slugGlobal),
          ctSlug,
        ),
      })),
      currentService: parsed.service,
      parentGroupId,
      subServices,
      cities: allCities.map((c) => ({
        ...c,
        targetUrl: buildTargetUrl(locale, svcSlug, c.slug),
      })),
      currentCity: parsed.city,
      districts: districts
        ? districts.map((d) => ({
            ...d,
            targetUrl: buildTargetUrl(locale, svcSlug, ctSlug, d.slug),
          }))
        : null,
      currentDistrict,
      wards: null,
      currentWard: null,
      places,
      currentPlace: placeSlug
        ? (places?.find((p) => p.slug.toLowerCase() === placeSlug.toLowerCase()) ?? null)
        : null,
    };

    let dealsPayload: Awaited<ReturnType<DealsService['getDeals']>>;
    if (parsed.city) {
      dealsPayload = await this.dealsService.getDeals({
        city_slug: parsed.city.slug,
        district_slug: currentDistrict?.slug ?? undefined,
        service_slug: parsed.service?.slugGlobal,
        page: 1,
        limit: 20,
        sort: DealSortOrder.RATING,
        locale: dealLocaleFromPage(locale),
      });
    } else {
      dealsPayload = { data: [], meta: buildPaginationMeta(1, 20, 0) };
    }

    const pageType: PageType = parsed.city ? (parsed.service ? 'category' : 'city') : 'not_found';

    let seoMeta: SeoMetaDto = {
      h1: 'Không tìm thấy trang',
      title: '404 - Không tìm thấy | Glow Explore',
      metaDescription: '',
      breadcrumbs: [{ label: homeLabel, url: '/' }],
      indexable: false,
    };

    if (parsed.city && !parsed.service) {
      seoMeta = buildCityOnlySeo(locale, parsed.city, dealsPayload.meta.total);
    } else if (parsed.service && parsed.city) {
      const serviceName = getLocaleName(parsed.service, locale);
      const cityName = getLocaleName(parsed.city, locale);
      const districtName = currentDistrict ? getLocaleName(currentDistrict, locale) : '';
      const h1 =
        currentDistrict != null
          ? locale === PageLocale.KO
            ? `${cityName} ${districtName} ${serviceName}`
            : `${serviceName} ${districtName}, ${cityName}`
          : locale === PageLocale.KO
            ? `${cityName} ${serviceName}`
            : `${serviceName} ${cityName}`;
      const total = dealsPayload.meta.total;
      const metaDescription =
        locale === PageLocale.EN
          ? total > 0
            ? `${total}+ ${serviceName.toLowerCase()} deals in ${cityName} on Glow Explore.`
            : `No ${serviceName.toLowerCase()} deals in ${cityName} yet. Browse more on Glow Explore.`
          : locale === PageLocale.KO
            ? total > 0
              ? `${cityName} ${serviceName} 딜 ${total}개 이상 — Glow Explore`
              : `${cityName} ${serviceName} 딜이 아직 없습니다. Glow Explore에서 주변 딜을 확인하세요.`
            : total > 0
              ? `${total}+ ưu đãi ${serviceName.toLowerCase()} — ${cityName} trên Glow Explore.`
              : `Chưa có ưu đãi ${serviceName.toLowerCase()} — ${cityName}. Xem thêm deal gần bạn.`;
      const servicePath =
        buildTargetUrl(
          locale,
          locale === PageLocale.VI
            ? (parsed.service.slugVi ?? parsed.service.slugGlobal)
            : locale === PageLocale.EN
              ? (parsed.service.slugEn ?? parsed.service.slugGlobal)
              : (parsed.service.slugKo ?? parsed.service.slugGlobal),
          null,
        ) ?? '#';
      seoMeta = {
        h1,
        title: `${h1} | Glow Explore`,
        metaDescription,
        breadcrumbs: [
          { label: homeLabel, url: '/' },
          { label: serviceName, url: servicePath },
          ...(currentDistrict
            ? [
                {
                  label: cityName,
                  url: buildTargetUrl(locale, svcSlug, parsed.city.slug) ?? '#',
                },
                { label: districtName, url: '#' },
              ]
            : [{ label: cityName, url: buildTargetUrl(locale, svcSlug, parsed.city.slug) ?? '#' }]),
        ],
        indexable: total >= 3,
      };
      const slugByLocale = buildLocalizedPageSlugs(
        parsed.service,
        parsed.city.slug,
        currentDistrict?.slug ?? null,
        null,
      );
      if (slugByLocale) seoMeta.slugByLocale = slugByLocale;
    } else if (parsed.service) {
      const serviceName = getLocaleName(parsed.service, locale);
      seoMeta = {
        h1: serviceName,
        title: `${serviceName} | Glow Explore`,
        metaDescription: '',
        breadcrumbs: [
          { label: homeLabel, url: '/' },
          { label: serviceName, url: '#' },
        ],
        indexable: false,
      };
      const slugByLocale = buildLocalizedPageSlugs(parsed.service, null, null, null);
      if (slugByLocale) seoMeta.slugByLocale = slugByLocale;
    }

    return {
      pageType,
      flashSaleHub: false,
      seoMeta,
      deals: dealsPayload,
      flashSale,
      filters,
    };
  }
}
