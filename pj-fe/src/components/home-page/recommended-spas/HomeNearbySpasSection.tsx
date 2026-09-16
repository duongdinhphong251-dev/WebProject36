import { ChevronRight } from "lucide-react";
import { getRecommendedSpas } from "@/services/api/home-api";
import { Container } from "@/components/ui/container";
import Link from "next/link";
import { NearbySpasWithClientGeo } from "./NearbySpasWithClientGeo";
import { getServerLocation } from "@/libs/server-location";

interface HomeNearbySpasSectionProps {
  locale?: string;
}

export async function HomeNearbySpasSection({ locale = "vi" }: HomeNearbySpasSectionProps) {
  const coords = await getServerLocation();
  const spas = await getRecommendedSpas({ limit: 4, locale, lat: coords?.lat, lng: coords?.lng }).catch(() => []);

  if (!spas || spas.length === 0) {
    return null;
  }

  const title =
    locale === "en"
      ? "Open Near You"
      : locale === "ko"
        ? "내 주변 오픈 매장"
        : "Gần bạn, đang mở";

  const viewAllText =
    locale === "en" ? "View all" : locale === "ko" ? "전체 보기" : "Xem tất cả";
  const viewAllHref = `/${locale}/spas?isOpenNow=true`;

  return (
    <section className="w-full pt-[13px] pb-[16px] md:py-5 overflow-x-hidden" aria-label={title}>
      <Container maxWidth="2xl" disableGutters className="px-[14px] md:px-4 lg:px-[20px]">
        {/* Section Header */}
        <div className="mb-3.5 md:mb-4 flex flex-row items-center justify-between">
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


        {/* Carousel with client geo-sorting */}
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
