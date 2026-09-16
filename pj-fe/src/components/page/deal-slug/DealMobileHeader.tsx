"use client";

import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import LocaleSwitcher from "@/components/common/locale-switcher";
import { SpaShareButton } from "@/components/page/spa-detail/SpaShareButton";
import type { LocaleTypes } from "@/i18n/settings";
import { useRouter } from "next/navigation";

export function DealMobileHeader({
  dealTitle,
  spaName,
  shareUrl,
  locale
}: {
  dealTitle: string;
  spaName: string;
  shareUrl: string;
  locale: LocaleTypes;
}) {
  const router = useRouter();

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-[#40813D] px-4 py-3 text-white lg:hidden">
        <div className="flex flex-1 items-center gap-3 overflow-hidden pr-2">
          <button
            onClick={() => router.back()}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 transition-colors hover:bg-white/25 active:scale-95"
            aria-label="Back"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-base font-semibold leading-tight text-white">{dealTitle}</h1>
            <p className="truncate text-xs font-normal text-white">{spaName}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LocaleSwitcher variant="mobile-globe" />
          <SpaShareButton
            spaName={spaName}
            shareUrl={shareUrl}
            locale={locale}
            buttonClassName="size-10 rounded-xl bg-white/15 hover:bg-white/25"
          />
        </div>
      </header>
      <div className="h-[64px] lg:hidden shrink-0" aria-hidden="true" />
    </>
  );
}
