import type { DealCardDto } from "@/types/api";
import { SpaDealItem } from "@/components/page/services-slug/SpaDealItem";

interface OtherDealsAtSpaProps {
  deals: DealCardDto[];
  title?: string;
}

export function OtherDealsAtSpa({ deals, title }: OtherDealsAtSpaProps) {
  if (!deals || deals.length === 0) return null;

  const displayTitle =
    title && title !== "other_deals_at_spa" && title !== "empty_state.other_deals_at_spa"
      ? title
      : "Ưu đãi khác tại spa này";

  return (
    <section className="w-full pt-2 pb-4">
      <h2 className="mb-3 md:mb-4 text-[15px] md:text-[20px] leading-[15px] md:leading-[20px] font-bold tracking-tight text-[#093E06]">
        {displayTitle}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {deals.map((deal) => (
          <div key={deal.id}>
            <SpaDealItem deal={deal} isLast={true} variant="card" />
          </div>
        ))}
      </div>
    </section>
  );
}
