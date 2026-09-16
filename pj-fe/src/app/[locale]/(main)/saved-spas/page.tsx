import type { Metadata } from "next";
import type { LocaleTypes } from "@/i18n/settings";
import { SavedSpasContent } from "@/components/page/saved-spas/SavedSpasContent";
import { buildPageMetadataCommon } from "@/libs/seo";

type Props = {
  params: Promise<{ locale: LocaleTypes }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === "vi" ? "Spa đã lưu | Nhom36" : "Saved Spas | Nhom36";
  const description = locale === "vi"
    ? "Danh sách các spa yêu thích đã lưu của bạn tại Nhom36."
    : "Your list of saved favorite spas on Nhom36.";

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
