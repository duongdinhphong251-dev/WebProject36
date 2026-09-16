import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getTranslation } from "@/i18n/server-cache";
import type { LocaleTypes } from "@/i18n/settings";
import { SERVICE_SLUGS, MAIN_SERVICE_GROUPS } from "@/constants/services";

interface NoServicePageProps {
  locale: LocaleTypes;
  /** City/district slug extracted from the current URL (e.g. "ha-noi") */
  citySlug?: string;
}

/**
 * Shown when URL is a city/district slug without a service prefix,
 * e.g. /vi/ha-noi. Guides user to pick a service, preserving the city context.
 */
export async function NoServicePage({ locale, citySlug }: NoServicePageProps) {
  const { t } = await getTranslation(locale, "services-slug");

  const SERVICE_LABELS: Record<string, Record<LocaleTypes, string>> = {
    "massage-spa": { vi: "Massage & Spa", en: "Massage & Spa", ko: "마사지 & 스파" },
    "beauty-hair": { vi: "Làm đẹp", en: "Beauty & Hair", ko: "뷰티 & 헤어" },
    "food-drink": { vi: "Ăn & Uống", en: "Food & Drink", ko: "맛집 & 카페" },
    tours: { vi: "Tour & Trải nghiệm", en: "Tours & Experiences", ko: "투어 & 액티비티" },
    transport: { vi: "Di chuyển", en: "Transport", ko: "교통 & 이동" },
    stay: { vi: "Lưu trú", en: "Stay", ko: "숙소" },
    health: { vi: "Sức khỏe & Y tế", en: "Health & Medical", ko: "건강 & 의료" },
    essentials: { vi: "Tiện ích du lịch", en: "Travel Essentials", ko: "여행 편의 시설" },
  };

  const quickServices = MAIN_SERVICE_GROUPS.map((key) => {
    const serviceSlug = SERVICE_SLUGS[key][locale];
    const href = citySlug
      ? `/${locale}/${serviceSlug}-${citySlug}`
      : `/${locale}/${serviceSlug}`;
    const label = SERVICE_LABELS[key]?.[locale] ?? key;
    return { key, href, label };
  });


  return (
    <main className="min-h-screen bg-app-bg flex flex-col items-center justify-center px-4 py-20 pt-5">
      <div className="flex flex-col items-center gap-4 max-w-[400px] w-full text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] mb-1">
          <Image
            src="/assets/images/common/logo_x.png"
            alt="GlowExplore"
            width={56}
            height={56}
            className="object-contain"
          />
        </div>

        <div>
          <h1 className="text-[18px] font-semibold text-[#181d27]">
            {t("no_service_title")}
          </h1>
          <p className="text-[14px] text-[#717680] leading-relaxed">
            {t("no_service_hint")}
          </p>
        </div>

        <div className="mt-2 flex flex-col gap-2 w-full">
          {quickServices.map(({ key, href, label }) => (
            <Link
              key={key}
              href={href}
              className="flex items-center justify-between rounded-[14px] border border-[#E6EBE4] bg-white px-4 py-3 text-[14px] font-medium text-[#143423] transition-colors hover:bg-[#f0f9f5]"
            >
              {label}
              <ChevronRight className="h-4 w-4 text-[#5B7A4F]" />
            </Link>
          ))}
        </div>

        <Link
          href={`/${locale}`}
          className="mt-2 text-[13px] text-[#717680] underline-offset-2 hover:underline"
        >
          {locale === "ko" ? "홈으로 돌아가기" : locale === "en" ? "Back to home" : "Về trang chủ"}
        </Link>
      </div>
    </main>
  );
}
