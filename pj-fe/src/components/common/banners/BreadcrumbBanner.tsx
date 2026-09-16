import type { LocaleTypes } from '@/i18n/settings';
import type { ComponentProps } from 'react';
import { BannerClickLink } from '@/components/common/banners/BannerClickLink';
import Image from 'next/image';
import { Container } from '@/components/ui/container';
import { getBreadcrumbBanner } from '@/services/api/banners';

type BreadcrumbBannerProps = {
  locale?: LocaleTypes;
  className?: string;
};

type BreadcrumbBannerSectionProps = {
  locale?: LocaleTypes;
  sectionClassName?: string;
  containerClassName?: string;
  maxWidth?: ComponentProps<typeof Container>['maxWidth'];
};

function renderBanner(banner: { targetUrl: string; gaClickTag?: string | null; name: string; imageUrl: string }) {
  return (
    <BannerClickLink
      href={banner.targetUrl}
      className="group block overflow-hidden rounded-[22px] border border-[#d7dfd9] bg-white shadow-[0_14px_32px_-24px_rgba(24,38,29,0.45)]"
      gaClickTag={banner.gaClickTag}
      bannerName={banner.name}
      placement="breadcrumb"
    >
      <div className="relative aspect-[16/4] w-full overflow-hidden bg-[#edf5ef]">
        <Image
          src={banner.imageUrl}
          alt={banner.name || 'Breadcrumb banner'}
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
    </BannerClickLink>
  );
}

export async function BreadcrumbBanner({ locale, className }: BreadcrumbBannerProps) {
  const banner = await getBreadcrumbBanner(locale);
  if (!banner?.imageUrl?.trim()) return null;

  return (
    <div className={className}>
      {renderBanner(banner)}
    </div>
  );
}

export async function BreadcrumbBannerSection({
  locale,
  sectionClassName,
  containerClassName,
  maxWidth = 'xl',
}: BreadcrumbBannerSectionProps) {
  const banner = await getBreadcrumbBanner(locale);
  if (!banner?.imageUrl?.trim()) return null;

  return (
    <section className={sectionClassName}>
      <Container maxWidth={maxWidth} className={containerClassName}>
        {renderBanner(banner)}
      </Container>
    </section>
  );
}
