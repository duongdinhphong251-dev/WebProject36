import type { LocaleTypes } from "@/i18n/settings";
import type { BreadcrumbItemDto } from "@/types/api";
import { BreadcrumbBanner } from "@/components/common/banners/BreadcrumbBanner";
import { Breadcrumbs } from "@/components/common/breadcrumbs/Breadcrumbs";
import { Container } from "@/components/ui/container";

interface PageHeroProps {
  title?: string;
  subtitle?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItemDto[];
  locale: LocaleTypes;
}

export function PageHero({
  title,
  subtitle,
  description,
  breadcrumbs,
  locale,
}: PageHeroProps) {
  return (
    <section
      className="w-full bg-app-bg pt-2 pb-0 md:pt-4 md:pb-0"
      aria-labelledby={title ? "page-hero-heading" : undefined}
    >
      <Container maxWidth={false} className="max-w-[1240px] px-4 md:px-5">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} className="mb-1 md:mb-3" />
        )}
        <BreadcrumbBanner locale={locale} className="mb-2 md:mb-3" />

        {/* H1 — Figma node 490:9412: Google Sans Medium 18px #0a0d12 */}
        {title && (
          <h1
            id="page-hero-heading"
            className="sr-only"
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mt-1 text-sm text-[#414651] md:text-base break-words whitespace-normal">{subtitle}</p>
        )}
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-[#535862] break-words whitespace-normal">{description}</p>
        )}
      </Container>
    </section>
  );
}
