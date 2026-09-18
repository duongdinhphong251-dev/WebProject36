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
}: SimilarSpasProps) {
  const targetSlug = serviceSlug || "massage-spa";

  const { t } = await getTranslation(locale, "deal-detail");

  let groups: Awaited<ReturnType<typeof resolvePage>>["deals"]["data"] = [];
  try {
    const payload = await resolvePage({
      url: targetSlug,
      locale,
      page: 1,
      limit: 20,
    });
    const all = (payload?.deals?.data ?? []).filter(
      (g) => String(g.spa.id) !== String(currentSpaId)
    );
    // Hiển thị ngẫu nhiên (random)
    groups = all.sort(() => 0.5 - Math.random()).slice(0, MAX_SIMILAR);
  } catch {
    return null;
  }

  if (groups.length === 0) return null;

  const title =
    t("other_spas") && t("other_spas") !== "other_spas"
      ? t("other_spas")
      : locale === "en"
        ? "Other spas"
        : locale === "ko"
          ? "다른 스파"
          : "Các spa khác";

  return (
    <section className="w-full pt-2 pb-4">
      <div className="mb-3 md:mb-4 flex flex-row items-center justify-between">
        <h2 className="text-[15px] md:text-[20px] font-bold tracking-tight text-[#093E06]">
          {title}
        </h2>
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
