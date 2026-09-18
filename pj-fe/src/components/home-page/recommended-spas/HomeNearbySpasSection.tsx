import { getRecommendedSpas } from "@/services/api/home-api";
import { Container } from "@/components/ui/container";
import { NearbySpasWithClientGeo } from "./NearbySpasWithClientGeo";

interface HomeNearbySpasSectionProps {
  locale?: string;
}

export async function HomeNearbySpasSection({ locale = "vi" }: HomeNearbySpasSectionProps) {
  const allSpas = await getRecommendedSpas({ limit: 20, locale }).catch(() => []);
  const spas = (allSpas || [])
    .map((s) => ({ ...s, distanceKm: undefined }))
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  if (!spas || spas.length === 0) {
    return null;
  }

  const title =
    locale === "en"
      ? "Top Deals Available"
      : locale === "ko"
        ? "추천 딜"
        : "Deal ngon hiện có";

  return (
    <section className="w-full pt-[13px] pb-[16px] md:py-5 overflow-x-hidden" aria-label={title}>
      <Container maxWidth="2xl" disableGutters className="px-[14px] md:px-4 lg:px-[20px]">
        {/* Section Header */}
        <div className="mb-3.5 md:mb-4 flex flex-row items-center justify-between">
          <h2 className="text-[15px] md:text-[20px] font-bold tracking-tight text-[#093E06]">
            {title}
          </h2>
        </div>

        {/* Carousel / Cards */}
        <NearbySpasWithClientGeo initialSpas={spas} locale={locale} />
      </Container>
    </section>
  );
}

export function HomeNearbySpasSectionSkeleton() {
  return (
    <div className="w-full pt-[13px] pb-[16px] md:py-5">
      <Container maxWidth="2xl" disableGutters className="px-[14px] md:px-4 lg:px-[20px]">
        <div className="mb-4 flex flex-row items-center justify-between">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-zinc-200/80" />
          <div className="h-5 w-20 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[340px] w-[280px] shrink-0 animate-pulse rounded-2xl bg-zinc-100 border border-zinc-200/60 p-3"
            >
              <div className="aspect-[4/3] w-full rounded-xl bg-zinc-200/80 mb-3" />
              <div className="h-5 w-4/5 rounded bg-zinc-200/80 mb-2" />
              <div className="h-4 w-1/2 rounded bg-zinc-200/60 mb-4" />
              <div className="h-16 w-full rounded-xl bg-zinc-200/60 mt-auto" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
