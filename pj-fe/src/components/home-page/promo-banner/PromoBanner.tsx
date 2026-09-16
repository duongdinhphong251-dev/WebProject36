import type { PromoBannerResponseDto } from '@/types/api';
import Link from 'next/link';
import Image from 'next/image';
import { shouldBypassNextImageOptimization } from '@/libs/spa-image-url';
import { Container } from '@/components/ui/container';
import { TrackingBanner } from '@/components/common/banners/TrackingBanner';


interface PromoBannerProps {
  items: PromoBannerResponseDto[];
  /** 'single' = 1 banner full width | 'double' = 2 banners side-by-side */
  variant?: 'single' | 'double';
  locale?: string;
}

function BannerItem({
  item,
  locale,
  index,
}: {
  item: PromoBannerResponseDto;
  locale?: string;
  index?: number;
}) {
  const href = item.dealId ? `/${locale ?? 'vi'}/organization_services/${item.dealId}` : '#';

  return (
    <TrackingBanner
      bannerName={item.title || 'promo_banner'}
      placement="promo"
      targetUrl={href}
      index={index}
    >
      <Link
        href={href}
        className="relative flex h-[65.56px] w-full items-center justify-center overflow-hidden rounded-xl transition-opacity hover:opacity-90 md:h-24 lg:h-28"
        style={item.imageUrl ? undefined : { background: 'linear-gradient(135deg, #5B7A4F 0%, #4A6340 100%)' }}
      >
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt={item.title || 'Promo banner'}
            fill
            priority={true}
            fetchPriority="high"
            unoptimized={shouldBypassNextImageOptimization(item.imageUrl)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1200px"
            className="object-cover"
            quality={80}
          />
        )}
        {item.title && (
          <span className="relative z-10 text-lg font-semibold text-white drop-shadow-sm md:text-2xl lg:text-3xl">
            {item.title}
          </span>
        )}
      </Link>
    </TrackingBanner>
  );
}

/**
 * RSC — static promo banner(s) from real API.
 * single: 1 banner full width
 * double: 2 banners side-by-side (mobile: stacked)
 */
export function PromoBanner({ items, variant = 'single', locale }: PromoBannerProps) {
  if (!items.length) return null;

  if (variant === 'single') {
    const item = items[0];
    if (!item) return null;
    return (
      <div className="py-2">
        <Container maxWidth="xl">
          <BannerItem item={item} locale={locale} index={1} />
        </Container>
      </div>
    );
  }

  // double: stacked mobile → grid 2-cols tablet+
  return (
    <div className="py-2">
      <Container maxWidth="xl">
        <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
          {items.slice(0, 2).map((item, index) => (
            <BannerItem key={item.id} item={item} locale={locale} index={index + 1} />
          ))}
        </div>
      </Container>
    </div>
  );
}
