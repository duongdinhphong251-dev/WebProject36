import type { LocaleTypes } from '@/i18n/settings';

// ─── Service Key (canonical identifier, locale-agnostic) ─────────────────────
export const SERVICE_KEY = {
  // Main 8 group hubs (Homepage)
  MASSAGE_SPA: 'massage-spa',
  BEAUTY_HAIR: 'beauty-hair',
  FOOD_DRINK: 'food-drink',
  TOURS: 'tours',
  TRANSPORT: 'transport',
  STAY: 'stay',
  HEALTH: 'health',
  ESSENTIALS: 'essentials',
} as const;

export type ServiceKey = (typeof SERVICE_KEY)[keyof typeof SERVICE_KEY];

// ─── Per-locale slug mapping ──────────────────────────────────────────────────
// Slug dùng để build URL: /<locale>/<slug>
export const SERVICE_SLUGS: Record<ServiceKey, Record<LocaleTypes, string>> = {
  // Main 8 groups (High search intent canonical slugs across locales)
  [SERVICE_KEY.MASSAGE_SPA]: {
    vi: 'massage-spa',
    en: 'massage-spa',
    ko: 'masaji-seupa',
  },
  [SERVICE_KEY.BEAUTY_HAIR]: {
    vi: 'lam-dep',
    en: 'beauty-hair',
    ko: 'byuti-he-eo',
  },
  [SERVICE_KEY.FOOD_DRINK]: {
    vi: 'an-uong',
    en: 'food-drink',
    ko: 'matjib-kape',
  },
  [SERVICE_KEY.TOURS]: {
    vi: 'tour-trai-nghiem',
    en: 'tours-experiences',
    ko: 'tueo-aegtibiti',
  },
  [SERVICE_KEY.TRANSPORT]: {
    vi: 'di-chuyen',
    en: 'transport',
    ko: 'gyotong-idong',
  },
  [SERVICE_KEY.STAY]: {
    vi: 'luu-tru',
    en: 'stay',
    ko: 'sugso',
  },
  [SERVICE_KEY.HEALTH]: {
    vi: 'suc-khoe-y-te',
    en: 'health-medical',
    ko: 'geongang-uiryo',
  },
  [SERVICE_KEY.ESSENTIALS]: {
    vi: 'tien-ich-du-lich',
    en: 'travel-essentials',
    ko: 'yeohaeng-pyeon-ui-siseol',
  },
};

// ─── Main 8 Service Groups (for homepage grid 2 rows × 4 columns) ────────────
export const MAIN_SERVICE_GROUPS = [
  SERVICE_KEY.MASSAGE_SPA,
  SERVICE_KEY.BEAUTY_HAIR,
  SERVICE_KEY.FOOD_DRINK,
  SERVICE_KEY.TOURS,
  SERVICE_KEY.TRANSPORT,
  SERVICE_KEY.STAY,
  SERVICE_KEY.HEALTH,
  SERVICE_KEY.ESSENTIALS,
] as const satisfies readonly ServiceKey[];

// ─── Ordered list of all service keys (for sitemaps, resolve slug, etc.) ─────
export const ALL_SERVICE_KEYS = [
  SERVICE_KEY.MASSAGE_SPA,
  SERVICE_KEY.BEAUTY_HAIR,
  SERVICE_KEY.FOOD_DRINK,
  SERVICE_KEY.TOURS,
  SERVICE_KEY.TRANSPORT,
  SERVICE_KEY.STAY,
  SERVICE_KEY.HEALTH,
  SERVICE_KEY.ESSENTIALS,
] as const satisfies readonly ServiceKey[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a fully-qualified service URL for a given locale.
 * e.g. getServiceUrl('massage-spa', 'vi') → '/vi/massage-spa'
 */
export function getServiceUrl(key: ServiceKey, locale: LocaleTypes, citySlug?: string | null): string {
  const slug = SERVICE_SLUGS[key][locale];
  if (citySlug) {
    return `/${locale}/${slug}-${citySlug}`;
  }
  return `/${locale}/${slug}`;
}

/**
 * Resolve a URL slug back to its canonical ServiceKey (for any locale).
 * Returns undefined if the slug doesn't match any service.
 * e.g. resolveServiceKey('massage-spa', 'vi') → 'massage-spa'
 */
export function resolveServiceKey(
  slug: string,
  locale: LocaleTypes,
): ServiceKey | undefined {
  return ALL_SERVICE_KEYS.find(
    (key) => {
      // 1. Check locales
      const locales: LocaleTypes[] = [locale, 'vi', 'en', 'ko'];
      for (const l of locales) {
        const serviceSlug = SERVICE_SLUGS[key][l];
        if (slug === serviceSlug || slug.startsWith(`${serviceSlug}-`)) {
          return true;
        }
      }

      // 2. Check key itself
      if (slug === key || slug.startsWith(`${key}-`)) {
        return true;
      }

      return false;
    }
  );
}

/**
 * Get the parent group key (one of the 8 main hubs) for a given service code or slug.
 */
export function getParentServiceKey(codeOrSlug: string): ServiceKey | null {
  if (!codeOrSlug) return null;
  const lower = codeOrSlug.toLowerCase();

  // 1. Match trực tiếp với MAIN_SERVICE_GROUPS
  const directMatch = MAIN_SERVICE_GROUPS.find(
    (key) => key.toLowerCase() === lower
  );
  if (directMatch) return directMatch;

  // 2. Fallback theo prefix
  if (lower.startsWith("massage") || lower.startsWith("body") || lower.startsWith("foot") || lower.startsWith("ear")) return SERVICE_KEY.MASSAGE_SPA;
  if (lower.startsWith("beauty") || lower.startsWith("nail") || lower.startsWith("hair") || lower.startsWith("skin") || lower.startsWith("wax")) return SERVICE_KEY.BEAUTY_HAIR;
  if (lower.startsWith("food") || lower.startsWith("restaurant") || lower.startsWith("cafe") || lower.startsWith("bar")) return SERVICE_KEY.FOOD_DRINK;
  if (lower.startsWith("tour") || lower.startsWith("city") || lower.startsWith("day") || lower.startsWith("cook") || lower.startsWith("attract") || lower.startsWith("outdoor")) return SERVICE_KEY.TOURS;
  if (lower.startsWith("transport") || lower.startsWith("airport") || lower.startsWith("car") || lower.startsWith("private") || lower.startsWith("limousine") || lower.startsWith("train")) return SERVICE_KEY.TRANSPORT;
  if (lower.startsWith("stay") || lower.startsWith("hotel") || lower.startsWith("resort") || lower.startsWith("home") || lower.startsWith("apartment")) return SERVICE_KEY.STAY;
  if (lower.startsWith("health") || lower.startsWith("pharmacy") || lower.startsWith("clinic") || lower.startsWith("dental") || lower.startsWith("emergency")) return SERVICE_KEY.HEALTH;
  if (lower.startsWith("essential") || lower.startsWith("esim") || lower.startsWith("exchange") || lower.startsWith("laundry") || lower.startsWith("luggage") || lower.startsWith("tailor") || lower.startsWith("coworking")) return SERVICE_KEY.ESSENTIALS;

  return null;
}
