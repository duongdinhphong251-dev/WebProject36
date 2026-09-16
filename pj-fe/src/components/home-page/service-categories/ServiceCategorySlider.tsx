import type { LocaleTypes } from "@/i18n/settings";
import { getTranslation } from "@/i18n/server-cache";
import { MAIN_SERVICE_GROUPS } from "@/constants/services";
import { Container } from "@/components/ui/container";
import { ServiceCategoryItem } from "./ServiceCategoryItem";
import { ServiceCategoryMobileContainer } from "./ServiceCategoryMobileContainer";

interface ServiceCategorySliderProps {
  locale: LocaleTypes;
}

export async function ServiceCategorySlider({ locale }: ServiceCategorySliderProps) {
  const { t } = await getTranslation(locale, "home");
  const title = t("home.what_do_you_need", locale === "en" ? "What do you need today?" : locale === "ko" ? "오늘 어떤 서비스가 필요하신가요?" : "Bạn cần gì hôm nay?");

  return (
    <section className="w-full pt-[13px] pb-[16px] md:py-4">
      <Container maxWidth="2xl" disableGutters className="px-[14px] md:px-4 lg:px-[20px]">
        <h2 className="text-[15px] md:text-[20px] leading-[15px] md:leading-[20px] font-bold tracking-tight text-[#093E06] mb-2.5 md:mb-4">
          {title}
        </h2>

        <div className="md:hidden">
          <ServiceCategoryMobileContainer locale={locale} />
        </div>

        <div className="hidden md:grid md:grid-cols-2 md:gap-3 lg:grid-cols-4 lg:gap-4 w-full">
          {MAIN_SERVICE_GROUPS.slice(0, 4).map((key, index) => (
            <ServiceCategoryItem key={key} serviceKey={key} locale={locale} priority={index < 4} />
          ))}
        </div>
      </Container>
    </section>
  );
}
