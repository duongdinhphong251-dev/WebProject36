import Link from "next/link";
import { getTranslation } from "@/i18n/server-cache";
import type { LocaleTypes } from "@/i18n/settings";

export default async function FooterPartnerBanner({ locale }: { locale: string }) {
  const { t: tHome } = await getTranslation(locale as LocaleTypes, "home");

  return (
    <footer className="w-full bg-[#093E06] text-white pt-8 pb-[calc(env(safe-area-inset-bottom,0px)+28px)]">
      <div className="mx-auto w-full max-w-[1560px] px-4 md:px-12 xl:px-[80px]">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Cột trái: Tên nhóm + tagline */}
          <div className="flex flex-col gap-3 w-full md:max-w-[400px]">
            <span className="text-[24px] font-bold text-white">Nhom36</span>
            <p className="text-[13px] text-[#E8FDE7]/80 leading-relaxed">
              Trải nghiệm địa phương đỉnh nhất — spa, ẩm thực, du lịch.
            </p>
          </div>

          {/* Cột phải: Categories */}
          <div className="flex flex-col">
            <h3 className="font-bold uppercase tracking-wider text-[11px] md:text-[13px] mb-3">
              DANH MỤC
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <Link href={`/${locale}/massage-spa`} className="text-[12px] md:text-[14px] text-[#E8FDE7]/80 hover:text-white">
                {tHome("home.services.massage-spa") || "Massage & Spa"}
              </Link>
              <Link href={`/${locale}/beauty-hair`} className="text-[12px] md:text-[14px] text-[#E8FDE7]/80 hover:text-white">
                {tHome("home.services.beauty-hair") || "Làm đẹp"}
              </Link>
              <Link href={`/${locale}/food-drink`} className="text-[12px] md:text-[14px] text-[#E8FDE7]/80 hover:text-white">
                {tHome("home.services.food-drink") || "Ăn & Uống"}
              </Link>
              <Link href={`/${locale}/tours`} className="text-[12px] md:text-[14px] text-[#E8FDE7]/80 hover:text-white">
                {tHome("home.services.tours") || "Tour & Trải nghiệm"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}