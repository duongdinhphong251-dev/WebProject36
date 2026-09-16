import type { Metadata } from "next";
import type { LocaleTypes } from "@/i18n/settings";
import HomePage from "@/components/home-page";
import { getTranslation } from "@/i18n/server-cache";
import { buildPageMetadataCommon } from "@/libs/seo/index";

import { Env } from "@/libs/Env";
import { buildHomeOrganizationJsonLd } from "@/libs/seo/schema-builder";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getTranslation(locale as LocaleTypes, "home");
  const path = "/";

  const KEYWORDS: Record<string, string[]> = {
    vi: ['spa', 'massage', 'làm đẹp', 'đặt lịch spa', 'deal spa', 'ưu đãi spa'],
    en: ['spa', 'massage', 'beauty', 'spa booking', 'spa deals', 'wellness'],
    ko: ['스파', '마사지', '뷰티', '스파 예약', '스파 딜', '웰니스'],
  };

  const baseMeta = buildPageMetadataCommon({
    locale,
    path,
    title: t("seo.title"),
    description: t("seo.description"),
    keywords: KEYWORDS[locale] ?? KEYWORDS.vi,
  });

  return {
    ...baseMeta,
  };
}

const IndexPage = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;

  const [{ t: tMain }, { t: tHome }] = await Promise.all([
    getTranslation(locale as LocaleTypes, "main-menu"),
    getTranslation(locale as LocaleTypes, "home"),
  ]);

  const baseUrl = Env.NEXT_PUBLIC_APP_URL || "https://Nhom36.com";

  const jsonLdData = buildHomeOrganizationJsonLd({
    baseUrl,
    locale,
    tMain,
    tHome,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />
      <h1 className="sr-only">{tHome("seo.title", "Nhom36")}</h1>
      <HomePage locale={locale} />
    </>
  );
};

export default IndexPage;
