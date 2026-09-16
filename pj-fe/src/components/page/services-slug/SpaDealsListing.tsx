import type { FlashSaleDto, PaginationMetaDto, SpaDealsGroupDto } from "@/types/api";
import type { LocaleTypes } from "@/i18n/settings";
import { SpaDealsCard } from "./SpaDealsCard";
import { SpaDealItem } from "./SpaDealItem";
import { createTranslation } from "@/i18n/server";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

interface SpaDealsListingProps {
  groups: SpaDealsGroupDto[];
  pagination: PaginationMetaDto;
  locale: LocaleTypes;
  flashSale?: FlashSaleDto;
  flashSaleHub?: boolean;
}

export async function SpaDealsListing({
  groups,
  pagination,
  locale,
  flashSale,
  flashSaleHub: _flashSaleHub = false,
}: SpaDealsListingProps) {
  const { t } = await createTranslation(locale, "services-slug");
  /** windowEndsAt từ BE — dùng cho mọi listing (BE isActive chỉ phản ánh block Home top 10, không khớp dealIds trên category). */
  const sharedCountdownEndAt = flashSale?.endsAt ?? null;

  if (groups.length === 0) {
    const suggestions = (flashSale?.deals ?? []).filter(Boolean).slice(0, 5);

    return (
      <section className="w-full space-y-8">
        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-10 shadow-sm sm:px-6">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-[#f5f5f5]">
              <div
                className="pointer-events-none absolute inset-2 rounded-full border-2 border-[#e9eaeb]"
                aria-hidden
              />
              <Search className="relative z-[1] h-10 w-10 text-[#a4a7ae]" strokeWidth={1.75} aria-hidden />
            </div>
            <h2 className="text-base font-semibold leading-snug text-[#0a0d12] sm:text-[16px]">
              {t("no_deals_title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#535862]">{t("no_deals_hint")}</p>
          </div>
        </div>

        {suggestions.length > 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
              <h3 className="text-sm font-semibold text-[#0a0d12]">{t("you_may_also_like")}</h3>
            </div>
            <div className="divide-y divide-[#e9eaeb] px-1 sm:px-2">
              {suggestions.map((deal, i) => (
                <SpaDealItem
                  key={deal.id}
                  deal={deal}
                  isLast={i === suggestions.length - 1}
                  sharedCountdownEndAt={sharedCountdownEndAt}
                />
              ))}
            </div>
            <div className="border-t border-gray-100 p-4">
              <Link
                href={`/${locale}/flash-sale`}
                className="inline-flex w-full items-center justify-center gap-1 rounded-xl border-2 border-[#5B7A4F] py-3 text-sm font-semibold text-[#5B7A4F] transition-colors hover:bg-[#f0f5f2]"
              >
                {t("view_more_deals")}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="w-full">
      {/* Grid */}
      <div className="flex w-full flex-col space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3">
        {groups.map((group) => (
          <SpaDealsCard
            key={group.spa.id}
            spa={group.spa}
            deals={group.deals}
            sharedCountdownEndAt={sharedCountdownEndAt}
          />
        ))}
      </div>

      {/* Pagination hint */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 text-center text-sm text-[#717680]">
          {t("page_info", { current: pagination.page, total: pagination.totalPages })}
        </div>
      )}
    </section>
  );
}
