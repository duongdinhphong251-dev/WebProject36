import type { DealDetailDto } from "@/types/deal-detail";

import { formatPrice } from "@/helpers/numbers";
import { CountdownTimer } from "./CountdownTimer";
import { DealDescription } from "./DealDescription";
import { getTranslation } from "@/i18n/server-cache";

function formatDateStr(isoStr: string | null | undefined, locale: string) {
  if (!isoStr) return "";
  const parts = isoStr.slice(0, 10).split("-");
  if (parts.length !== 3) return "";
  const [y, m, d] = parts;
  if (locale === "en") return `${m}/${d}/${y}`;
  if (locale === "ko") return `${y}. ${m}. ${d}.`;
  return `${d}/${m}/${y}`;
}

interface DealInfoProps {
  deal: DealDetailDto;
  locale: string;
}

export async function DealInfo({ deal, locale }: DealInfoProps) {
  const { t } = await getTranslation(locale, "deal-detail");
  const title = deal.title;


  const short = (deal.shortDescription ?? "").trim();
  const fullTrim = (deal.content ?? "").trim();
  const sameBody = short && fullTrim && short === fullTrim;

  const showFlashCountdown = !!(deal.isFlashSale && deal.flashSaleEndsAt);


  const firstPrice = (deal as any).variants?.[0]?.prices?.[0];
  const salePrice = deal.salePrice ?? firstPrice?.salePrice ?? null;
  const originalPrice = deal.originalPrice ?? firstPrice?.originalPrice ?? null;

  return (
    <div className="flex min-w-0 w-full flex-col gap-3 lg:gap-0 lg:overflow-hidden lg:rounded-2xl lg:bg-white lg:shadow-[0_1px_10px_-6px_rgba(20,52,35,0.30)]">
      {/* Box 1: Title, Price, Tags, Time */}
      <section className="overflow-hidden rounded-2xl bg-white px-4 py-4 shadow-[0_1px_10px_-6px_rgba(20,52,35,0.30)] sm:px-5 lg:rounded-none lg:bg-transparent lg:p-4 lg:pb-0 sm:lg:p-5 sm:lg:pb-0 lg:shadow-none">
        {/* Title */}
        <h1 className="min-w-0 break-words text-[16.5px] font-bold leading-tight text-[#093E06] lg:text-[24px]">
          {title}
        </h1>

        {/* Price (Mobile) */}
        {salePrice != null && (
          <div className="mt-3 flex items-end justify-between lg:hidden">
            <div className="flex items-baseline gap-2">
              <span className="text-[20px] font-bold leading-none text-[#2A7627]">
                {formatPrice(salePrice)}
              </span>
              {originalPrice != null && originalPrice > salePrice && (
                <span className="mb-[2px] text-[13px] leading-none text-[#7C8A78] line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>

          </div>
        )}

        {/* Tags */}
        {deal.variants?.[0] && (deal.variants[0].durationMin || deal.variants[0].pax) ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {deal.variants[0].durationMin ? (
              <span className="rounded-lg bg-[#DDE4D9] px-2.5 py-1 text-xs font-medium text-[#093E06]">
                {locale === "en"
                  ? `${deal.variants[0].durationMin} mins`
                  : locale === "ko"
                    ? `${deal.variants[0].durationMin}분`
                    : `${deal.variants[0].durationMin} phút`}
              </span>
            ) : null}
            {deal.variants[0].pax ? (
              <span className="rounded-lg bg-[#DDE4D9] px-2.5 py-1 text-xs font-medium text-[#093E06]">
                {locale === "en"
                  ? `${deal.variants[0].pax} ${deal.variants[0].pax > 1 ? "guests" : "guest"}`
                  : locale === "ko"
                    ? `${deal.variants[0].pax}명`
                    : `${deal.variants[0].pax} người`}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Giá + countdown + thời gian */}
        {showFlashCountdown && (
          <div
            className="mt-3 min-w-0 rounded-2xl bg-white p-3"
            style={{ border: "1px solid #EBEBEB" }}
          >
            {/* Row 1: Badge — Flashsale */}
            {deal.isFlashSale ? (
              <div className="mb-2.5 flex">
                <span
                  className="inline-flex items-center gap-1.5 rounded-[11px] px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: "#f04438", color: "#fff" }}
                >
                  {t("deal.flash_sale")}
                </span>
              </div>
            ) : null}

            {/* Row 2: Countdown */}
            <div className="flex min-w-0 items-center justify-start gap-3">
              <div className="shrink-0">
                <CountdownTimer
                  endAt={deal.flashSaleEndsAt}
                  label={t("deal.flash_sale_ends")}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      <hr className="hidden lg:block border-t border-[#093E0612] lg:mx-4 lg:mt-4 lg:mb-0" />
      {/* Box 2: Thông tin ưu đãi */}
      <section className="overflow-hidden rounded-2xl bg-white px-4 py-4 shadow-[0_1px_10px_-6px_rgba(20,52,35,0.30)] sm:px-5 lg:mt-0 lg:rounded-none lg:bg-transparent lg:p-4 lg:pt-4 sm:lg:p-5 sm:lg:pt-4 lg:shadow-none">
        <h2 className="mb-3 text-[16px] font-bold text-[#093E06]">
          {t("deal.deal_info") !== "deal.deal_info" ? t("deal.deal_info") : "Thông tin ưu đãi"}
        </h2>
        <DealDescription short={short} fullTrim={fullTrim} sameBody={!!sameBody} />
      </section>

      <hr className="hidden lg:block border-t border-[#093E0612] lg:mx-4 lg:mt-4 lg:mb-0" />
      {/* Box 3: Điều kiện áp dụng */}
      <section className="overflow-hidden rounded-2xl bg-white px-4 py-4 shadow-[0_1px_10px_-6px_rgba(20,52,35,0.30)] sm:px-5 lg:mt-0 lg:rounded-none lg:bg-transparent lg:p-4 lg:pt-4 sm:lg:p-5 sm:lg:pt-4 lg:shadow-none">
        <h2 className="mb-3 text-[16px] font-bold text-[#093E06]">
          {t("deal.conditions_apply") !== "deal.conditions_apply" ? t("deal.conditions_apply") : "Điều kiện áp dụng"}
        </h2>
        <div className="flex flex-col gap-2">
          {deal.startAt && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#5B6B58]">{t("deal.start_date") !== "deal.start_date" ? t("deal.start_date") : "Ngày bắt đầu"}</span>
              <span className="font-medium text-[#093E06]">
                {formatDateStr(deal.startAt, locale)}
              </span>
            </div>
          )}
          {deal.endAt && (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#5B6B58]">{t("deal.end_date") !== "deal.end_date" ? t("deal.end_date") : "Ngày kết thúc"}</span>
              <span className="font-medium text-[#093E06]">
                {formatDateStr(deal.endAt, locale)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[#5B6B58]">{t("deal.reservation") !== "deal.reservation" ? t("deal.reservation") : "Đặt trước"}</span>
            <span className="font-medium text-[#093E06]">{t("deal.chat_before_2h") !== "deal.chat_before_2h" ? t("deal.chat_before_2h") : "nên chat trước 2 giờ"}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
