import type { LocaleTypes } from "@/i18n/settings";
import Link from "next/link";
import { getFlashSale } from "@/services/api/spa-api";
import { getTranslation } from "@/i18n/server-cache";
import { YouMayAlsoLikeCard } from "./YouMayAlsoLikeCard";
// Direct import — avoid barrel file (Vercel bundle-barrel-imports)
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";

const MAX_SUGGESTIONS = 3;

interface YouMayAlsoLikeProps {
  locale: LocaleTypes;
}

/**
 * Server Component — fetches flash sale deals and renders suggestion cards.
 * Uses React.cache() in getFlashSale — no duplicate network call if called elsewhere.
 * Returns null when no deals available (Vercel async-defer-await).
 */
export async function YouMayAlsoLike({ locale }: YouMayAlsoLikeProps) {
  const { t } = await getTranslation(locale, "deal-detail");

  let deals = [];
  try {
    const flashSale = await getFlashSale(locale);
    deals = (flashSale?.deals ?? []).slice(0, MAX_SUGGESTIONS);
  } catch {
    // Graceful fallback — don't break the page if flash sale API fails
    return null;
  }

  if (deals.length === 0) return null;

  return (
    <section className="w-full px-4 pb-10">
      <h3 className="mb-3 text-[16px] font-medium text-[#0a0d12]">
        {t("empty_state.you_may_also_like")}
      </h3>

      {/* Deal cards */}
      <div className="flex flex-col gap-2">
        {deals.map((deal) => (
          <YouMayAlsoLikeCard key={deal.id} deal={deal} locale={locale} />
        ))}
      </div>

      {/* View more button */}
      <div className="mt-4 flex justify-center">
        <Link
          href={`/${locale}/flash-sale`}
          className="inline-flex items-center gap-1.5 rounded-[14px] border border-[#bfe1d9] bg-[#f0f5f2] px-4 py-2.5 text-[14px] font-medium text-[#5B7A4F] transition-opacity hover:opacity-80"
        >
          {t("empty_state.view_more_deals")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
