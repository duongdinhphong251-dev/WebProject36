import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { LocaleTypes } from "@/i18n/settings";
import { PageTemplate } from "@/components/page/services-slug/PageTemplate";
import { resolvePage } from "@/services/api/spa-api";
import { parseLonLatFromSearch } from "@/libs/geo-url-params";
import { parseCoordsFromLocationCookie } from "@/libs/geo-server";
import { buildPageMetadataCommon } from "@/libs/seo";

type Props = {
  params: Promise<{ locale: LocaleTypes }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const FLASH_SALE_META: Record<
  LocaleTypes,
  { title: string; description: string; keywords: string[] }
> = {
  vi: {
    title: "Flash Sale Spa & Massage - Ưu đãi giới hạn mỗi ngày | GlowExplore",
    description:
      "Khám phá deal flash sale spa và massage giá sốc hôm nay. Đặt lịch ngay để nhận ưu đãi giảm giá lên đến 50% tại các spa uy tín gần bạn.",
    keywords: [
      "flash sale spa",
      "deal spa hôm nay",
      "massage giảm giá",
      "ưu đãi spa",
    ],
  },
  en: {
    title: "Flash Sale Spa & Massage - Limited Daily Deals | GlowExplore",
    description:
      "Discover today's flash sale spa and massage deals. Book now to get up to 50% off at top-rated spas near you.",
    keywords: [
      "flash sale spa",
      "spa deals today",
      "massage discount",
      "spa offers",
    ],
  },
  ko: {
    title: "플래시 세일 스파 & 마사지 - 오늘의 한정 특가 | GlowExplore",
    description:
      "오늘의 스파 및 마사지 플래시 세일 딜을 확인하세요. 지금 예약하면 근처 인기 스파에서 최대 50% 할인 혜택을 받을 수 있습니다.",
    keywords: [
      "플래시 세일 스파",
      "오늘의 스파 딜",
      "마사지 할인",
      "스파 특가",
    ],
  },
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const sp = (await searchParams) ?? {};
  const coords = parseLonLatFromSearch(sp);
  const meta = FLASH_SALE_META[locale] ?? FLASH_SALE_META.vi;

  try {
    const payload = await resolvePage({
      url: "flash-sale",
      locale,
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
    });

    const title = payload.seoMeta.title || meta.title;
    const description = payload.seoMeta.metaDescription || meta.description;

    return buildPageMetadataCommon({
      locale,
      path: "/flash-sale",
      title,
      description,
      keywords: meta.keywords,
      ogTitle: title,
      ogDescription: description,
    });
  } catch {
    return buildPageMetadataCommon({
      locale,
      path: "/flash-sale",
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
    });
  }
}

/**
 * Hub flash sale — cùng layout PageTemplate như /massage (breadcrumb, FilterBar, deal nhóm theo spa),
 * BE chỉ trả deal đang trong khung flash, không lọc theo dịch vụ.
 */
export default async function FlashSaleHubPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const sp = (await searchParams) ?? {};
  const urlCoords = parseLonLatFromSearch(sp);
  // Fallback: đọc từ cookie tuoi-location nếu URL không có lat/lng
  const coords = urlCoords ?? (await parseCoordsFromLocationCookie());
  const priceSort = sp.priceSort as string | undefined;
  const minRatingRaw = sp.minRating as string | undefined;
  const minRating = minRatingRaw ? parseFloat(minRatingRaw) : undefined;

  let payload;
  try {
    payload = await resolvePage({
      url: "flash-sale",
      locale,
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      ...(priceSort ? { priceSort } : {}),
      ...(minRating && minRating > 0 ? { minRating } : {}),
    });
  } catch (error: any) {
    if (error?.status === 404) {
      notFound();
    }
    throw error;
  }

  // resolvePage không throw khi BE trả pageType === 'not_found' → phải check thủ công
  if (!payload || payload.pageType === "not_found") {
    notFound();
  }

  return (
    <PageTemplate
      payload={payload}
      locale={locale}
      resolveUrl="flash-sale"
      lat={coords?.lat}
      lng={coords?.lng}
    />
  );
}
