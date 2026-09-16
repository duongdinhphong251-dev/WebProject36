import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { LocaleTypes } from "@/i18n/settings";
import { getTranslation } from "@/i18n/server-cache";
import { resolvePage } from "@/services/api/spa-api";
import { NearbySpaCard } from "@/components/home-page/recommended-spas/NearbySpaCard";
import type { RecommendedSpaDto } from "@/types/api";

const MAX_SIMILAR = 3;

interface SimilarSpasProps {
  locale: LocaleTypes;
  currentSpaId: string;
  serviceSlug?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export async function SimilarSpas({
  locale,
  currentSpaId,
  serviceSlug,
  lat,
  lng,
}: SimilarSpasProps) {
  if (!serviceSlug) return null;

  const { t } = await getTranslation(locale, "deal-detail");

  let groups: Awaited<ReturnType<typeof resolvePage>>["deals"]["data"] = [];
  try {
    const payload = await resolvePage({
      url: serviceSlug,
      locale,
      page: 1,
      limit: MAX_SIMILAR + 1, // +1 để bù trường hợp phải loại spa hiện tại
      lat: lat ?? undefined,
      lng: lng ?? undefined,
      sortBy: "distance",
    });
    groups = (payload?.deals?.data ?? [])
      .filter((g) => g.spa.id !== currentSpaId)
      .slice(0, MAX_SIMILAR);
  } catch {
    return null;
  }

  if (groups.length === 0) return null;

  const title =
    t("similar_spas_nearby") !== "similar_spas_nearby"
      ? t("similar_spas_nearby")
      : "Spa tương tự gần bạn";

  const viewAllText = locale === "en" ? "View all" : locale === "ko" ? "전체 보기" : "Xem tất cả";
  const viewAllHref = `/${locale}/${serviceSlug}`;

  return (
    <section className="w-full pt-2 pb-4">
      <div className="mb-3 md:mb-4 flex flex-row items-center justify-between">
        <h2 className="text-[15px] md:text-[20px] font-bold tracking-tight text-[#093E06]">
          {title}
        </h2>
        
        <Link
          href={viewAllHref}
          className="group inline-flex items-center gap-1 text-[13px] font-semibold text-[#40813D] hover:text-[#2a5828] transition-colors shrink-0"
          aria-label={`Xem tất cả ${title}`}
        >
          <span>{viewAllText}</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {groups.map((g) => {
          const recommendedSpa: RecommendedSpaDto = {
            ...g.spa,
            activeDealCount: g.deals.length,
            bestDeal: g.deals[0] ? {
              id: g.deals[0].id,
              title: g.deals[0].title,
              slug: g.deals[0].slug,
              canonicalSlug: g.deals[0].canonicalSlug,
              salePrice: g.deals[0].salePrice,
              originalPrice: g.deals[0].originalPrice,
              discountPercent: g.deals[0].discountPercent,
              currency: g.deals[0].currency,
            } : null,
          };

          return (
            <NearbySpaCard key={g.spa.id} spa={recommendedSpa} locale={locale} />
          );
        })}
      </div>
    </section>
  );
}
