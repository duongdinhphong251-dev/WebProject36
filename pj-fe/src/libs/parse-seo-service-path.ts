import type { LocaleTypes } from "@/i18n/settings";
import type {
  CityResponseDto,
  PlaceResponseDto,
  ServiceResponseDto,
} from "@/types/api";
import { localizeLocationName } from "@/libs/localize-location-name";

export type InferredGeoFromPath = {
  service: ServiceResponseDto | null;
  city: CityResponseDto | null;
  /** Slug quận khi URL dạng service-district-city; chưa resolve sang DTO nếu chưa có danh sách quận */
  districtSlug: string | null;
};

/**
 * Parse segment động kiểu `massage-binh-duong` / `massage-cau-giay-ha-noi` (slug phẳng, không slash).
 * Dùng khi BE trả not_found nhưng URL vẫn mang ngữ cảnh địa lý — đồng bộ logic với tuoi-be pages.service.
 */
export function inferGeoFromFlatPath(
  segment: string | undefined,
  locale: LocaleTypes,
  services: ServiceResponseDto[],
  cities: CityResponseDto[],
): InferredGeoFromPath {
  const empty: InferredGeoFromPath = { service: null, city: null, districtSlug: null };
  if (!segment?.trim()) return empty;

  const normalized = segment.toLowerCase().trim().replace(/\/+$/, "");

  const citiesBySlugLen = [...cities].sort((a, b) => b.slug.length - a.slug.length);
  for (const c of citiesBySlugLen) {
    if (normalized === c.slug.toLowerCase()) {
      return { service: null, city: c, districtSlug: null };
    }
  }

  type Cand = { service: ServiceResponseDto; prefix: string };
  const candidates: Cand[] = [];
  for (const s of services) {
    const prefixes: string[] = [];
    if (locale === "vi" && s.slugVi) prefixes.push(s.slugVi.toLowerCase());
    prefixes.push(s.slugGlobal.toLowerCase());
    const unique = [...new Set(prefixes)];
    for (const p of unique) {
      if (p) candidates.push({ service: s, prefix: p });
    }
  }
  candidates.sort((a, b) => b.prefix.length - a.prefix.length);

  for (const { service, prefix } of candidates) {
    if (normalized === prefix) {
      return { service, city: null, districtSlug: null };
    }
    if (!normalized.startsWith(`${prefix}-`)) continue;
    const remainder = normalized.slice(prefix.length + 1);
    if (!remainder) return { service, city: null, districtSlug: null };

    const citySorted = [...cities].sort((a, b) => b.slug.length - a.slug.length);
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

export function cityDisplayName(
  city: CityResponseDto,
  locale: LocaleTypes,
): string {
  return localizeLocationName(city.nameVi, locale, city.nameEn, city.nameKo);
}

export function districtDisplayName(
  district: { nameVi: string; nameEn?: string | null; nameKo?: string | null },
  locale: LocaleTypes,
): string {
  return localizeLocationName(district.nameVi, locale, district.nameEn, district.nameKo);
}

export function placeDisplayName(
  place: Pick<PlaceResponseDto, "nameVi" | "nameEn" | "nameKo">,
  locale?: LocaleTypes,
): string {
  return localizeLocationName(place.nameVi, locale, place.nameEn, place.nameKo);
}

export function wardDisplayName(
  ward: { nameVi: string; nameEn?: string | null; nameKo?: string | null },
  locale: LocaleTypes,
): string {
  return localizeLocationName(ward.nameVi, locale, ward.nameEn, ward.nameKo);
}

export function serviceDisplayName(
  service: ServiceResponseDto,
  locale: LocaleTypes,
): string {
  if (locale === "en" && service.nameEn) return service.nameEn;
  if (locale === "ko" && service.nameKo) return service.nameKo;
  return service.nameVi;
}
