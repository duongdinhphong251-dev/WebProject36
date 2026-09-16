import type { SpaListing } from '@/libs/mock-data/home-page.mock';
import Image from 'next/image';
import { shouldBypassNextImageOptimization } from '@/libs/spa-image-url';
import CustomLink from '@/components/common/link';
import { SaveSpaButton } from '@/components/common/save-spa-button/SaveSpaButton';

interface SpaCardProps {
  spa: SpaListing;
}

/**
 * RSC — Figma: 148×163px card (node 5:2519)
 * Image: clipped to "Subtract" shape — 140×111 rounded rect with top-right notch
 * Brand color (#5B7A4F) shows through the notch area.
 */
export function SpaCard({ spa }: SpaCardProps) {
  const card = (
    <div
      className="relative flex-shrink-0 rounded-xl bg-white shadow-sm w-[148px] min-h-[163px] md:w-[160px] md:min-h-[176px] lg:w-[168px] lg:min-h-[185px] flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
    >
      {/* Image area — card has 4px padding on sides & top per Figma */}
      <div className="relative mx-1 mt-1 aspect-[140/111] w-[calc(100%-8px)] shrink-0">
        {/* Hidden SVG with clipPath definition */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <clipPath id={`spa-clip-${spa.id}`} clipPathUnits="objectBoundingBox">
              <path transform="scale(0.007142857, 0.009009009)" d="M97.7295 0C104.357 0 109.729 5.37258 109.729 12V21C109.73 27.0749 114.655 31.9999 120.729 32H128C134.627 32 140 37.3726 140 44V99C140 105.627 134.627 111 128 111H12C5.37258 111 0 105.627 0 99V12C0 5.37258 5.37258 0 12 0H97.7295Z" />
            </clipPath>
          </defs>
        </svg>

        {/* Brand color background (visible through notch) */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'var(--brand-500)',
            clipPath: `url(#spa-clip-${spa.id})`,
          }}
        />

        {/* Actual image, clipped to same shape */}
        {spa.imageUrl && (
          <Image
            src={spa.imageUrl}
            alt={spa.name}
            fill
            className="object-cover"
            unoptimized={shouldBypassNextImageOptimization(spa.imageUrl)}
            sizes="(min-width: 1024px) 168px, (min-width: 768px) 160px, 140px"
            style={{ clipPath: `url(#spa-clip-${spa.id})` }}
            quality={100}
          />
        )}
      </div>

      {/* Save Button top-left */}
      <div className="absolute z-20 left-2 top-2">
        <SaveSpaButton spaId={spa.spaSlug || spa.id} size={14} className="p-1 shadow-xs" />
      </div>

      {/* Discount badge — Figma: 27×30px at x:116,y:4 from card, radius 8, Error/500 red */}
      {spa.discount && (
        <div
          className="absolute z-10 flex items-center justify-center rounded-lg bg-[#f04438] w-[27px] h-[30px] right-[5px] top-[4px] md:w-[36px] md:h-[40px] md:right-[8px] md:top-[8px]"
        >
          <span className="text-[9px] md:text-[12px] font-semibold leading-none text-white">
            {`-${spa.discount}%`}
          </span>
        </div>
      )}


      {/* Info area */}
      <div className="px-2 pb-2 pt-1.5 flex-1 flex flex-col justify-center">
        <p className="line-clamp-1 text-xs md:text-base lg:text-lg font-semibold text-zinc-950">
          {spa.name}
        </p>
        <div className="mt-0.5 flex items-center gap-1">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#414651"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="md:w-4 md:h-4 lg:w-5 lg:h-5 shrink-0"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span className="line-clamp-1 text-[10px] md:text-sm lg:text-base text-gray-700">
            {spa.location}
          </span>
        </div>
      </div>
    </div>
  );

  if (!spa.spaSlug) {
    return card;
  }

  return (
    <CustomLink
      href={`/provider/${spa.spaSlug}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B7A4F] focus-visible:ring-offset-2 rounded-xl"
    >
      {card}
    </CustomLink>
  );
}


export function SpaCardSkeleton() {
  return (
    <div
      className="flex-shrink-0 animate-pulse overflow-hidden rounded-xl bg-zinc-100 w-[148px] h-[163px] md:w-[160px] md:h-[176px] lg:w-[168px] lg:h-[185px] flex flex-col"
    >
      <div className="mx-1 mt-1 aspect-[140/111] w-[calc(100%-8px)] bg-zinc-200 shrink-0" />
      <div className="px-1.5 pb-2 pt-1 flex-1 flex flex-col justify-center gap-1 md:px-3">
        <div className="h-3 md:h-4 w-3/4 rounded bg-zinc-200" />
        <div className="h-2.5 md:h-3 w-1/2 rounded bg-zinc-200" />
      </div>
    </div>
  );
}
