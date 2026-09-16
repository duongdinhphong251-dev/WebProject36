import type { CityResponseDto } from "@/types/api";

export interface CityGeoBounds {
  slug: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  centerLat: number;
  centerLng: number;
}

/**
 * Bảng bounding box và tâm toạ độ cho 63 tỉnh/thành phố Việt Nam.
 * Phù hợp với toàn bộ slug trả về từ API /api/v1/locations/cities.
 */
export const VIETNAM_CITY_BOUNDS: CityGeoBounds[] = [
  // ─── 5 Thành phố trực thuộc Trung ương ───────────────────────────────────────
  {
    slug: "ha-noi",
    minLat: 20.55,
    maxLat: 21.40,
    minLng: 105.28,
    maxLng: 106.05,
    centerLat: 21.0285,
    centerLng: 105.8542,
  },
  {
    slug: "ho-chi-minh",
    minLat: 10.37,
    maxLat: 11.16,
    minLng: 106.35,
    maxLng: 107.05,
    centerLat: 10.8231,
    centerLng: 106.6297,
  },
  {
    slug: "da-nang",
    minLat: 15.90,
    maxLat: 16.25,
    minLng: 107.80,
    maxLng: 108.35,
    centerLat: 16.0544,
    centerLng: 108.2022,
  },
  {
    slug: "hai-phong",
    minLat: 20.50,
    maxLat: 21.05,
    minLng: 106.50,
    maxLng: 107.15,
    centerLat: 20.8449,
    centerLng: 106.6881,
  },
  {
    slug: "can-tho",
    minLat: 9.90,
    maxLat: 10.35,
    minLng: 105.25,
    maxLng: 105.90,
    centerLat: 10.0452,
    centerLng: 105.7469,
  },

  // ─── Đồng bằng sông Hồng & Đông Bắc Bộ ───────────────────────────────────────
  {
    slug: "bac-ninh",
    minLat: 20.95,
    maxLat: 21.28,
    minLng: 105.90,
    maxLng: 106.35,
    centerLat: 21.1861,
    centerLng: 106.0763,
  },
  {
    slug: "bac-giang",
    minLat: 21.10,
    maxLat: 21.65,
    minLng: 105.85,
    maxLng: 107.10,
    centerLat: 21.2731,
    centerLng: 106.1946,
  },
  {
    slug: "vinh-phuc",
    minLat: 21.15,
    maxLat: 21.60,
    minLng: 105.30,
    maxLng: 105.80,
    centerLat: 21.3089,
    centerLng: 105.6049,
  },
  {
    slug: "hai-duong",
    minLat: 20.70,
    maxLat: 21.25,
    minLng: 106.10,
    maxLng: 106.65,
    centerLat: 20.9375,
    centerLng: 106.3145,
  },
  {
    slug: "hung-yen",
    minLat: 20.60,
    maxLat: 21.05,
    minLng: 105.85,
    maxLng: 106.25,
    centerLat: 20.6464,
    centerLng: 106.0511,
  },
  {
    slug: "ha-nam",
    minLat: 20.35,
    maxLat: 20.75,
    minLng: 105.75,
    maxLng: 106.15,
    centerLat: 20.5452,
    centerLng: 105.9122,
  },
  {
    slug: "nam-dinh",
    minLat: 19.95,
    maxLat: 20.50,
    minLng: 105.90,
    maxLng: 106.60,
    centerLat: 20.4388,
    centerLng: 106.1806,
  },
  {
    slug: "thai-binh",
    minLat: 20.20,
    maxLat: 20.70,
    minLng: 106.20,
    maxLng: 106.70,
    centerLat: 20.4463,
    centerLng: 106.3366,
  },
  {
    slug: "ninh-binh",
    minLat: 20.00,
    maxLat: 20.45,
    minLng: 105.55,
    maxLng: 106.20,
    centerLat: 20.2506,
    centerLng: 105.9745,
  },
  {
    slug: "quang-ninh",
    minLat: 20.65,
    maxLat: 21.90,
    minLng: 106.40,
    maxLng: 108.10,
    centerLat: 21.0069,
    centerLng: 107.2925,
  },
  {
    slug: "phu-tho",
    minLat: 20.90,
    maxLat: 21.80,
    minLng: 104.80,
    maxLng: 105.50,
    centerLat: 21.3228,
    centerLng: 105.2280,
  },
  {
    slug: "thai-nguyen",
    minLat: 21.30,
    maxLat: 22.05,
    minLng: 105.45,
    maxLng: 106.25,
    centerLat: 21.5674,
    centerLng: 105.8252,
  },
  {
    slug: "lang-son",
    minLat: 21.30,
    maxLat: 22.45,
    minLng: 106.10,
    maxLng: 107.40,
    centerLat: 21.8537,
    centerLng: 106.7624,
  },
  {
    slug: "cao-bang",
    minLat: 22.25,
    maxLat: 23.15,
    minLng: 105.25,
    maxLng: 106.90,
    centerLat: 22.6667,
    centerLng: 106.2500,
  },
  {
    slug: "bac-kan",
    minLat: 21.80,
    maxLat: 22.75,
    minLng: 105.40,
    maxLng: 106.30,
    centerLat: 22.1471,
    centerLng: 105.8348,
  },
  {
    slug: "tuyen-quang",
    minLat: 21.50,
    maxLat: 22.70,
    minLng: 104.90,
    maxLng: 105.60,
    centerLat: 21.8234,
    centerLng: 105.2144,
  },
  {
    slug: "ha-giang",
    minLat: 22.15,
    maxLat: 23.40,
    minLng: 104.35,
    maxLng: 105.60,
    centerLat: 22.8233,
    centerLng: 104.9839,
  },

  // ─── Tây Bắc Bộ ─────────────────────────────────────────────────────────────
  {
    slug: "lao-cai",
    minLat: 22.00,
    maxLat: 22.90,
    minLng: 103.50,
    maxLng: 104.65,
    centerLat: 22.4856,
    centerLng: 103.9707,
  },
  {
    slug: "yen-bai",
    minLat: 21.30,
    maxLat: 22.30,
    minLng: 103.90,
    maxLng: 105.20,
    centerLat: 21.7168,
    centerLng: 104.8973,
  },
  {
    slug: "hoa-binh",
    minLat: 20.30,
    maxLat: 21.05,
    minLng: 104.80,
    maxLng: 105.85,
    centerLat: 20.8133,
    centerLng: 105.3383,
  },
  {
    slug: "son-la",
    minLat: 20.65,
    maxLat: 22.05,
    minLng: 103.15,
    maxLng: 105.10,
    centerLat: 21.3256,
    centerLng: 103.9144,
  },
  {
    slug: "dien-bien",
    minLat: 21.00,
    maxLat: 22.60,
    minLng: 102.15,
    maxLng: 103.65,
    centerLat: 21.3860,
    centerLng: 103.0227,
  },
  {
    slug: "lai-chau",
    minLat: 21.70,
    maxLat: 22.85,
    minLng: 102.30,
    maxLng: 103.90,
    centerLat: 22.3964,
    centerLng: 103.4684,
  },

  // ─── Bắc Trung Bộ & Duyên hải Miền Trung ────────────────────────────────────
  {
    slug: "thanh-hoa",
    minLat: 19.30,
    maxLat: 20.70,
    minLng: 104.35,
    maxLng: 106.10,
    centerLat: 19.8075,
    centerLng: 105.7764,
  },
  {
    slug: "nghe-an",
    minLat: 18.55,
    maxLat: 20.00,
    minLng: 103.85,
    maxLng: 105.80,
    centerLat: 18.6734,
    centerLng: 105.6813,
  },
  {
    slug: "ha-tinh",
    minLat: 17.90,
    maxLat: 18.75,
    minLng: 105.10,
    maxLng: 106.55,
    centerLat: 18.3429,
    centerLng: 105.9059,
  },
  {
    slug: "quang-binh",
    minLat: 16.90,
    maxLat: 18.10,
    minLng: 105.60,
    maxLng: 106.99,
    centerLat: 17.4690,
    centerLng: 106.6225,
  },
  {
    slug: "quang-tri",
    minLat: 16.30,
    maxLat: 17.20,
    minLng: 106.40,
    maxLng: 107.45,
    centerLat: 16.8163,
    centerLng: 107.1004,
  },
  {
    slug: "hue",
    minLat: 16.00,
    maxLat: 16.80,
    minLng: 107.00,
    maxLng: 108.20,
    centerLat: 16.4637,
    centerLng: 107.5909,
  },
  {
    slug: "quang-nam",
    minLat: 14.95,
    maxLat: 16.05,
    minLng: 107.20,
    maxLng: 108.75,
    centerLat: 15.5651,
    centerLng: 108.4815,
  },
  {
    slug: "quang-ngai",
    minLat: 14.50,
    maxLat: 15.45,
    minLng: 108.10,
    maxLng: 109.15,
    centerLat: 15.1205,
    centerLng: 108.7923,
  },
  {
    slug: "binh-dinh",
    minLat: 13.70,
    maxLat: 14.75,
    minLng: 108.60,
    maxLng: 109.35,
    centerLat: 13.7820,
    centerLng: 109.2197,
  },
  {
    slug: "phu-yen",
    minLat: 12.70,
    maxLat: 13.70,
    minLng: 108.65,
    maxLng: 109.45,
    centerLat: 13.0882,
    centerLng: 109.3136,
  },
  {
    slug: "khanh-hoa",
    minLat: 11.70,
    maxLat: 12.90,
    minLng: 108.65,
    maxLng: 109.40,
    centerLat: 12.2388,
    centerLng: 109.1967,
  },
  {
    slug: "ninh-thuan",
    minLat: 11.30,
    maxLat: 12.20,
    minLng: 108.65,
    maxLng: 109.25,
    centerLat: 11.5653,
    centerLng: 108.9882,
  },
  {
    slug: "binh-thuan",
    minLat: 10.55,
    maxLat: 11.60,
    minLng: 107.40,
    maxLng: 108.90,
    centerLat: 10.9333,
    centerLng: 108.1000,
  },

  // ─── Tây Nguyên ─────────────────────────────────────────────────────────────
  {
    slug: "kon-tum",
    minLat: 14.15,
    maxLat: 15.45,
    minLng: 107.35,
    maxLng: 108.65,
    centerLat: 14.3497,
    centerLng: 108.0005,
  },
  {
    slug: "gia-lai",
    minLat: 13.15,
    maxLat: 14.60,
    minLng: 107.40,
    maxLng: 108.90,
    centerLat: 13.9833,
    centerLng: 108.0000,
  },
  {
    slug: "dak-lak",
    minLat: 12.15,
    maxLat: 13.45,
    minLng: 107.45,
    maxLng: 109.15,
    centerLat: 12.6667,
    centerLng: 108.0500,
  },
  {
    slug: "dak-nong",
    minLat: 11.75,
    maxLat: 12.80,
    minLng: 107.20,
    maxLng: 108.10,
    centerLat: 12.0041,
    centerLng: 107.6875,
  },
  {
    slug: "lam-dong",
    minLat: 11.15,
    maxLat: 12.35,
    minLng: 107.30,
    maxLng: 108.75,
    centerLat: 11.9404,
    centerLng: 108.4583,
  },

  // ─── Đông Nam Bộ ───────────────────────────────────────────────────────────
  {
    slug: "binh-phuoc",
    minLat: 11.35,
    maxLat: 12.30,
    minLng: 106.40,
    maxLng: 107.45,
    centerLat: 11.7512,
    centerLng: 106.9038,
  },
  {
    slug: "tay-ninh",
    minLat: 11.00,
    maxLat: 11.80,
    minLng: 105.80,
    maxLng: 106.40,
    centerLat: 11.3102,
    centerLng: 106.0984,
  },
  {
    slug: "binh-duong",
    minLat: 10.85,
    maxLat: 11.55,
    minLng: 106.35,
    maxLng: 106.98,
    centerLat: 11.1667,
    centerLng: 106.6500,
  },
  {
    slug: "dong-nai",
    minLat: 10.60,
    maxLat: 11.60,
    minLng: 106.70,
    maxLng: 107.65,
    centerLat: 10.9575,
    centerLng: 106.8427,
  },
  {
    slug: "ba-ria-vung-tau",
    minLat: 8.55, // bao gồm Côn Đảo
    maxLat: 10.75,
    minLng: 106.50,
    maxLng: 107.60,
    centerLat: 10.4967,
    centerLng: 107.1689,
  },

  // ─── Đồng bằng sông Cửu Long ────────────────────────────────────────────────
  {
    slug: "long-an",
    minLat: 10.35,
    maxLat: 11.05,
    minLng: 105.50,
    maxLng: 106.80,
    centerLat: 10.5367,
    centerLng: 106.4132,
  },
  {
    slug: "tien-giang",
    minLat: 10.15,
    maxLat: 10.65,
    minLng: 105.80,
    maxLng: 106.80,
    centerLat: 10.3589,
    centerLng: 106.3639,
  },
  {
    slug: "ben-tre",
    minLat: 9.80,
    maxLat: 10.35,
    minLng: 106.00,
    maxLng: 106.80,
    centerLat: 10.2433,
    centerLng: 106.3756,
  },
  {
    slug: "tra-vinh",
    minLat: 9.50,
    maxLat: 10.05,
    minLng: 106.00,
    maxLng: 106.65,
    centerLat: 9.9347,
    centerLng: 106.3456,
  },
  {
    slug: "vinh-long",
    minLat: 9.90,
    maxLat: 10.35,
    minLng: 105.70,
    maxLng: 106.20,
    centerLat: 10.2537,
    centerLng: 105.9722,
  },
  {
    slug: "dong-thap",
    minLat: 10.10,
    maxLat: 10.95,
    minLng: 105.15,
    maxLng: 106.00,
    centerLat: 10.4619,
    centerLng: 105.6328,
  },
  {
    slug: "an-giang",
    minLat: 10.15,
    maxLat: 10.95,
    minLng: 104.75,
    maxLng: 105.60,
    centerLat: 10.3878,
    centerLng: 105.4208,
  },
  {
    slug: "kien-giang",
    minLat: 9.35,
    maxLat: 10.55,
    minLng: 103.75, // bao gồm Phú Quốc
    maxLng: 105.45,
    centerLat: 10.0133,
    centerLng: 105.0809,
  },
  {
    slug: "hau-giang",
    minLat: 9.55,
    maxLat: 9.95,
    minLng: 105.25,
    maxLng: 105.90,
    centerLat: 9.7844,
    centerLng: 105.4701,
  },
  {
    slug: "soc-trang",
    minLat: 9.20,
    maxLat: 9.95,
    minLng: 105.55,
    maxLng: 106.35,
    centerLat: 9.6033,
    centerLng: 105.9800,
  },
  {
    slug: "bac-lieu",
    minLat: 9.00,
    maxLat: 9.65,
    minLng: 105.15,
    maxLng: 105.85,
    centerLat: 9.2941,
    centerLng: 105.7278,
  },
  {
    slug: "ca-mau",
    minLat: 8.50,
    maxLat: 9.35,
    minLng: 104.70,
    maxLng: 105.50,
    centerLat: 9.1769,
    centerLng: 105.1524,
  },
];

/**
 * Tính khoảng cách đường chim bay giữa 2 điểm toạ độ theo công thức Haversine (đơn vị: km).
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Bán kính trái đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Kiểm tra toạ độ có nằm trong bounding-box không.
 */
function isCoordInBounds(lat: number, lng: number, b: CityGeoBounds): boolean {
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

/**
 * Map toạ độ (lat, lng) sang Thành phố (CityResponseDto) theo cơ chế Bounding-box + Haversine (offline, client-side, 0 API cost).
 *
 * Quy tắc:
 * 1. Tìm tất cả thành phố có bounding box chứa toạ độ (lat, lng).
 * 2. Nếu không có box nào khớp → return null.
 * 3. Nếu chỉ có 1 box khớp → trả về thành phố đó.
 * 4. Nếu có nhiều box chồng lấn → chọn thành phố có khoảng cách từ (lat, lng) tới tâm (centerLat, centerLng) nhỏ nhất.
 */
export function mapCoordsToCity(
  lat: number,
  lng: number,
  cities: CityResponseDto[],
): CityResponseDto | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Array.isArray(cities) || cities.length === 0) {
    return null;
  }

  // Lọc các bounding box chứa toạ độ
  const matchedBounds = VIETNAM_CITY_BOUNDS.filter((b) => isCoordInBounds(lat, lng, b));

  const firstMatch = matchedBounds[0];
  if (!firstMatch) {
    return null;
  }

  let selectedSlug: string;

  if (matchedBounds.length === 1) {
    selectedSlug = firstMatch.slug;
  } else {
    // Nhiều box chồng lấn: tìm box có khoảng cách tâm gần nhất
    let minDistance = Number.POSITIVE_INFINITY;
    let closestSlug = firstMatch.slug;

    for (const bound of matchedBounds) {
      const dist = calculateHaversineDistanceKm(lat, lng, bound.centerLat, bound.centerLng);
      if (dist < minDistance) {
        minDistance = dist;
        closestSlug = bound.slug;
      }
    }
    selectedSlug = closestSlug;
  }

  const foundCity = cities.find((c) => c.slug.toLowerCase() === selectedSlug.toLowerCase());
  return foundCity ?? null;
}
