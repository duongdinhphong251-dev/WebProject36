import type { DealLocale } from '../../modules/deals/dto/deals-query.dto';
import type { PageLocale } from '../../modules/pages/dto/page-resolve-query.dto';

type SupportedLocale = DealLocale | PageLocale | 'vi' | 'en' | 'ko';

interface LocalizedText {
  vi?: string | null;
  en?: string | null;
  ko?: string | null;
}

interface ComposeAreaTitleInput {
  locale?: SupportedLocale;
  service: LocalizedText;
  location: LocalizedText;
}

interface ParsedTimeRange {
  startTime: string;
  endTime: string;
  label: string;
}

/** ZWSP/BOM/soft hyphen/word joiner — nếu không loại sẽ thành dấu `-` giữa các chữ cái trong slug. */
function stripInvisibleAndFormatChars(input: string): string {
  return input.replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, '');
}

export function stripVietnameseAccents(input?: string | null): string {
  if (!input) return '';
  return stripInvisibleAndFormatChars(String(input))
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .replace(/\s+/g, ' ')
    .trim();
}

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;
const HANGUL_MEDIAL_COUNT = 21;
const HANGUL_FINAL_COUNT = 28;
const HANGUL_BLOCK_SIZE = HANGUL_MEDIAL_COUNT * HANGUL_FINAL_COUNT;
const HANGUL_INITIAL_ROMA = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const HANGUL_MEDIAL_ROMA = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const HANGUL_FINAL_ROMA = ['', 'k', 'k', 'ks', 'n', 'nj', 'nh', 't', 'l', 'lk', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'p', 'ps', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 'h'];

function romanizeKorean(input: string): string {
  let out = '';
  for (const char of input.normalize('NFC')) {
    const code = char.codePointAt(0);
    if (!code) continue;
    if (code >= HANGUL_BASE && code <= HANGUL_END) {
      const syllableIndex = code - HANGUL_BASE;
      const initial = Math.floor(syllableIndex / HANGUL_BLOCK_SIZE);
      const medial = Math.floor((syllableIndex % HANGUL_BLOCK_SIZE) / HANGUL_FINAL_COUNT);
      const final = syllableIndex % HANGUL_FINAL_COUNT;
      out += `${HANGUL_INITIAL_ROMA[initial] ?? ''}${HANGUL_MEDIAL_ROMA[medial] ?? ''}${HANGUL_FINAL_ROMA[final] ?? ''}`;
      continue;
    }
    out += char;
  }
  return out;
}

export function normalizeSlug(input?: string | null, locale?: SupportedLocale): string {
  const raw = stripInvisibleAndFormatChars(String(input ?? '').trim());
  if (!raw) return 'item';

  // ko: romanize Hangul trước (NFC), rồi bỏ dấu Latin — khi fallback title_vi sang slug_ko vẫn ra dạng ear-cleaning / gwi-cheongso + id
  const source =
    locale === 'ko'
      ? stripVietnameseAccents(romanizeKorean(raw.normalize('NFC')))
      : stripVietnameseAccents(raw);
  const normalized = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return normalized || 'item';
}

const SLUG_MAX_LEN = 255;

export function buildLocalizedSlug(input: {
  locale?: SupportedLocale;
  text?: string | null;
  id?: string | number | null;
}): string {
  const base = normalizeSlug(input.text, input.locale);
  const idSuffix = input.id == null || input.id === '' ? '' : `-${String(input.id).trim()}`;
  const combined = `${base}${idSuffix}`;
  if (combined.length <= SLUG_MAX_LEN) return combined;
  const maxBase = Math.max(1, SLUG_MAX_LEN - idSuffix.length);
  const trimmed = base.slice(0, maxBase).replace(/-+$/g, '');
  return `${trimmed}${idSuffix}`;
}

export function pickLocalizedText(text: LocalizedText, locale?: SupportedLocale): string {
  if (locale === 'en') return text.en?.trim() || text.vi?.trim() || text.ko?.trim() || '';
  if (locale === 'ko') return text.ko?.trim() || text.vi?.trim() || text.en?.trim() || '';
  return text.vi?.trim() || text.en?.trim() || text.ko?.trim() || '';
}

/** Title deal: ưu title_* đã dịch; en/ko thiếu thì ghép dịch vụ + địa danh theo locale (đồng bộ listing / deal detail). */
export function pickDealDisplayTitle(
  row: {
    titleVi: string | null;
    titleEn: string | null;
    titleKo: string | null;
    serviceNameVi?: string | null;
    serviceNameEn?: string | null;
    serviceNameKo?: string | null;
    cityName?: string | null;
    cityNameEn?: string | null;
    cityNameKo?: string | null;
  },
  locale?: DealLocale,
): string {
  const vi = row.titleVi?.trim() || '';
  const en = row.titleEn?.trim() || '';
  const ko = row.titleKo?.trim() || '';
  if (locale === 'en') {
    if (en) return en;
    const svc = row.serviceNameEn?.trim() || stripVietnameseAccents(row.serviceNameVi || '') || '';
    const locVi = row.cityName?.trim() || '';
    if (svc && locVi) return `${svc} ${stripVietnameseAccents(locVi)}`.trim();
    return stripVietnameseAccents(vi) || vi;
  }
  if (locale === 'ko') {
    if (ko) return ko;
    const svc =
      row.serviceNameKo?.trim() ||
      row.serviceNameEn?.trim() ||
      stripVietnameseAccents(row.serviceNameVi || '') ||
      '';
    const loc =
      row.cityNameKo?.trim() ||
      row.cityNameEn?.trim() ||
      stripVietnameseAccents(row.cityName || '') ||
      '';
    if (loc && svc) return `${loc} ${svc}`.trim();
    if (en) return en;
    return stripVietnameseAccents(vi) || vi;
  }
  return vi || en || ko;
}

export function composeLocalizedAreaTitle(input: ComposeAreaTitleInput): string {
  const serviceVi = input.service.vi?.trim() || input.service.en?.trim() || input.service.ko?.trim() || '';
  const serviceEn = input.service.en?.trim() || serviceVi;
  const serviceKo = input.service.ko?.trim() || serviceVi;
  const locationVi = input.location.vi?.trim() || input.location.en?.trim() || input.location.ko?.trim() || '';
  const locationKo = input.location.ko?.trim() || locationVi;

  if (input.locale === 'en') {
    return [serviceEn, stripVietnameseAccents(locationVi)].filter(Boolean).join(' ').trim();
  }

  if (input.locale === 'ko') {
    return [locationKo, serviceKo].filter(Boolean).join(' ').trim();
  }

  return [serviceVi, locationVi].filter(Boolean).join(' ').trim();
}

function normalizeTime(hourRaw: string, minuteRaw: string): string | null {
  const hour = Number.parseInt(hourRaw, 10);
  const minute = Number.parseInt(minuteRaw, 10);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function tryParseHHmmPair(a: string, b: string): ParsedTimeRange | null {
  const ma = a.trim().match(/^(\d{1,2}):(\d{2})$/);
  const mb = b.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!ma || !mb) return null;
  const startTime = normalizeTime(ma[1]!, ma[2]!);
  const endTime = normalizeTime(mb[1]!, mb[2]!);
  if (!startTime || !endTime || startTime === endTime) return null;
  return { startTime, endTime, label: `${startTime}-${endTime}` };
}

/** Bắt khoảng giờ trong ngày kiểu 9:00-11:00, 09:00 – 11:30, 9:00 đến 11:00 trong mô tả deal. */
export function parseTimeRangeFromText(input?: string | null): ParsedTimeRange | null {
  if (!input) return null;
  const text = String(input);

  const paired = text.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
  if (paired) {
    const hit = tryParseHHmmPair(paired[1]!, paired[2]!);
    if (hit) return hit;
  }

  const den = text.match(/(\d{1,2}:\d{2})\s*(?:đến|tới|to|until)\s+(\d{1,2}:\d{2})/i);
  if (den) {
    const hit = tryParseHHmmPair(den[1]!, den[2]!);
    if (hit) return hit;
  }

  const legacy = text.match(/(?:^|\D)(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})(?=\D|$)/);
  if (legacy) {
    const hit = tryParseHHmmPair(`${legacy[1]}:${legacy[2]}`, `${legacy[3]}:${legacy[4]}`);
    if (hit) return hit;
  }

  return null;
}

export function buildTimeRangeLabel(startTime?: string | null, endTime?: string | null): string | null {
  const start = startTime?.trim()?.slice(0, 5) || null;
  const end = endTime?.trim()?.slice(0, 5) || null;
  if (!start || !end) return null;
  return `${start}-${end}`;
}
