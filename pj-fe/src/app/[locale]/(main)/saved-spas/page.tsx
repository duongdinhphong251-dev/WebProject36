import type { Metadata } from "next";
import type { LocaleTypes } from "@/i18n/settings";
import { SavedSpasContent } from "@/components/page/saved-spas/SavedSpasContent";
import { buildPageMetadataCommon } from "@/libs/seo";

type Props = {
  params: Promise<{ locale: LocaleTypes }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === "vi" ? "Spa đã lưu | GlowExplore" : "Saved Spas | GlowExplore";
  const description = locale === "vi"
    ? "Danh sách các spa yêu thích đã lưu của bạn tại GlowExplore."
    : "Your list of saved favorite spas on GlowExplore.";

  return buildPageMetadataCommon({
    locale,
    path: "/saved-spas",
    title,
    description,
  });
}

export default async function SavedSpasPage({ params }: Props) {
  const { locale } = await params;
  return <SavedSpasContent locale={locale} />;
}
