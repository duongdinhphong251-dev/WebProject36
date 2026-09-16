import { ChevronRight } from "lucide-react";
import type { RecommendedSpaDto } from '@/types/api';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { RecommendedSpaScroll } from './RecommendedSpaScroll';

interface RecommendedSpasProps {
  title: string;
  spas: RecommendedSpaDto[];
  viewAllText?: string;
  /** Hub category (deal theo spa + filter), không dùng /spas. */
  viewAllHref: string;
  locale?: string;
}

/**
 * RSC wrapper — section header server-rendered, scroll is client Swiper.
 */
export function RecommendedSpas({
  title,
  spas,
  viewAllText = 'View all',
  viewAllHref,
  locale,
}: RecommendedSpasProps) {
  if (!spas.length) return null;

  return (
    <section className="w-full py-3 overflow-x-hidden" aria-label={title}>
      <Container maxWidth="xl">
        {/* Section header */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-950 md:text-2xl lg:text-3xl">{title}</h2>
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-sm md:text-base lg:text-lg font-medium text-zinc-500 hover:text-[#5B7A4F] transition-colors"
            aria-label={`Xem tất cả ${title}`}
          >
            {viewAllText}
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 lg:w-5 lg:h-5 ml-0.5 stroke-[2]" />
          </Link>
        </div>

        {/* Swiper horizontal scroll — Client */}
        <RecommendedSpaScroll spas={spas} locale={locale} />
      </Container>
    </section>
  );
}

export function RecommendedSpasSkeleton() {
  return (
    <div className="w-full py-3">
      <Container maxWidth="xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-6 w-40 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-16 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[163px] w-[148px] flex-shrink-0 animate-pulse rounded-xl bg-zinc-100"
            />
          ))}
        </div>
      </Container>
    </div>
  );
}

/** Skeleton chỉ cho phần scroll cards — dùng khi title đã hiển thị sẵn */
export function RecommendedSpasScrollSkeleton() {
  return (
    <div className="flex gap-3 pb-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[163px] w-[148px] flex-shrink-0 animate-pulse rounded-xl bg-zinc-100"
        />
      ))}
    </div>
  );
}
