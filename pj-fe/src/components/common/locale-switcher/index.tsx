"use client";

import { useParams, usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";
import { locales, LANGUAGE_COOKIE } from "@/i18n/settings";
import type { LocaleTypes } from "@/i18n/settings";
import { setCookie } from "cookies-next";
import { resolveServiceKey, SERVICE_SLUGS } from "@/constants/services";
import ViIcon from "@/components/common/icons/Vi";
import EnglishIcon from "@/components/common/icons/English"
import { useLocalizedSlugsStore } from "@/stores/localized-slugs/useLocalizedSlugsStore";

const LOCALE_META: Record<
  LocaleTypes,
  { label: string; icon: React.ReactNode }
> = {
  vi: {
    label: "Tiếng Việt",
    icon: <ViIcon className="w-full h-full object-cover" />,
  },
  en: {
    label: "English",
    icon: <EnglishIcon className="w-full h-full object-cover" />,
  },
  ko: {
    label: "",
    icon: null,
  },
};

export default function LocaleSwitcher({
  variant = "dropdown",
  showChevron = false,
  pillStyle = false,
  triggerClassName,
  chevronClassName,
}: {
  variant?: "dropdown" | "segmented" | "pill-globe" | "mobile-globe";
  showChevron?: boolean;
  pillStyle?: boolean;
  triggerClassName?: string;
  chevronClassName?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const params = useParams();
  const pathname = usePathname();
  const currentLocale = (params?.locale as LocaleTypes) ?? "vi";
  const localizedSlugs = useLocalizedSlugsStore((s) => s.slugs);

  const handleLocaleChange = (newLocale: LocaleTypes) => {
    if (newLocale === currentLocale) return;

    let filteredSegments = pathname.split("/").filter(Boolean).slice(1);

    if (localizedSlugs && filteredSegments.length > 0) {
      const targetSlug = localizedSlugs[newLocale];
      if (targetSlug) {
        filteredSegments[filteredSegments.length - 1] = targetSlug;
      }
    } else if (filteredSegments.length > 0) {
      // Fallback: translate service-level slugs (e.g. category pages)
      const currentSlug = filteredSegments[0];
      if (currentSlug) {
        const serviceKey = resolveServiceKey(currentSlug, currentLocale);
        if (serviceKey) {
          filteredSegments[0] = SERVICE_SLUGS[serviceKey][newLocale];
        }
      }
    }

    const basePath =
      filteredSegments.length > 0 ? `/${filteredSegments.join("/")}` : "";

    // Preserve existing query params (e.g. lat, lng, priceSort)
    const search = typeof window !== "undefined" ? window.location.search : "";
    
    // Set the cookie for middleware to use
    setCookie(LANGUAGE_COOKIE, newLocale, { maxAge: 365 * 24 * 60 * 60, path: '/' });

    startTransition(() => {
      router.replace(`/${newLocale}${basePath}${search}`, { scroll: false });
    });
  };

  if (variant === "pill-globe") {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-xl bg-white/15 px-3.5 text-white transition-colors hover:bg-white/20"
          >
            <Globe className="size-4" strokeWidth={1.8} />
            <span className="text-[13.5px] font-semibold">
              {LOCALE_META[currentLocale]?.label}
            </span>
            <ChevronDown className="size-3 text-[#E8FDE7]" strokeWidth={2.5} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[180px] rounded-2xl border border-black/[0.05] bg-white p-1 shadow-lg"
        >
          {(locales as unknown as LocaleTypes[]).filter((l) => l !== 'ko').map((locale) => {
            const meta = LOCALE_META[locale];
            const isActive = locale === currentLocale;
            return (
              <DropdownMenuItem
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={cn(
                  "flex h-[58px] cursor-pointer items-center gap-3 rounded-xl px-2 py-4 outline-none transition-colors focus:bg-[#fafafa]",
                  isActive ? "bg-[#fafafa]" : "bg-transparent hover:bg-[#fafafa]",
                )}
              >
                <span className="flex shrink-0 items-center justify-center h-6 w-6 overflow-hidden">
                  {meta.icon}
                </span>
                <span className="flex-1 text-[18px] font-normal leading-[150%] text-[#181d27]">
                  {meta.label}
                </span>
                {isActive && (
                  <Check className="size-4 shrink-0" style={{ color: "#112b1d", strokeWidth: 2.5 }} />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "mobile-globe") {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-10 items-center gap-1.5 rounded-xl bg-white/15 px-3 text-white transition-colors hover:bg-white/25"
          >
            <Globe className="size-5" strokeWidth={2} />
            <span className="text-[14px] font-bold uppercase tracking-wide">
              {currentLocale}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[180px] rounded-2xl border border-black/[0.05] bg-white p-1 shadow-lg"
        >
          {(locales as unknown as LocaleTypes[]).filter((l) => l !== 'ko').map((locale) => {
            const meta = LOCALE_META[locale];
            const isActive = locale === currentLocale;
            return (
              <DropdownMenuItem
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={cn(
                  "flex h-[58px] cursor-pointer items-center gap-3 rounded-xl px-2 py-4 outline-none transition-colors focus:bg-[#fafafa]",
                  isActive ? "bg-[#fafafa]" : "bg-transparent hover:bg-[#fafafa]",
                )}
              >
                <span className="flex shrink-0 items-center justify-center h-6 w-6 overflow-hidden">
                  {meta.icon}
                </span>
                <span className="flex-1 text-[18px] font-normal leading-[150%] text-[#181d27]">
                  {meta.label}
                </span>
                {isActive && (
                  <Check className="size-4 shrink-0" style={{ color: "#112b1d", strokeWidth: 2.5 }} />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "segmented") {
    return (
      <div className="flex items-center gap-0 rounded-[13px] bg-white/20 p-[2px]">
        {(locales as unknown as LocaleTypes[]).filter((l) => l !== 'ko').map((locale) => {
          const meta = LOCALE_META[locale];
          const isActive = locale === currentLocale;
          return (
            <button
              key={locale}
              type="button"
              onClick={() => handleLocaleChange(locale)}
              className={cn(
                "flex h-8 w-10 items-center justify-center rounded-xl transition-all",
                isActive
                  ? "bg-white shadow-sm"
                  : "bg-transparent hover:bg-white/10",
              )}
              aria-label={meta.label}
              aria-pressed={isActive}
            >
              <div className="flex h-6 w-6 shrink-0 overflow-hidden items-center justify-center">
                {meta.icon}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        {/* Trigger: chỉ hiện icon cờ, nếu pillStyle thì hiện như viên thuốc có chevron */}
        <Button
          variant="ghost"
          className={cn(
            "flex items-center justify-center overflow-hidden shrink-0 [&_svg]:!opacity-100",
            pillStyle
              ? "h-[34px] rounded-full border border-slate-200 gap-1.5 px-1.5 py-1 shadow-sm"
              : "h-[32px] w-[32px] max-sm:h-[28px] max-sm:w-[28px] rounded-xl p-0 [&_svg]:!w-full [&_svg]:!h-full",
            triggerClassName
          )}
          aria-label="Switch language"
        >
          <div className={cn("shrink-0 overflow-hidden flex items-center justify-center", pillStyle ? "h-[22px] w-[22px] rounded-full" : "w-full h-full")}>
            {LOCALE_META[currentLocale]?.icon}
          </div>
          {showChevron && <ChevronDown className={cn("h-4 w-4 text-slate-500 mr-0.5", chevronClassName)} />}
        </Button>
      </DropdownMenuTrigger>

      {/* Dropdown matches Figma "Choose language": w=180px, rounded-2xl, white bg, subtle border+shadow */}
      <DropdownMenuContent
        align="end"
        className="w-[180px] rounded-2xl border border-black/[0.05] bg-white p-1 shadow-lg"
      >
        {(locales as unknown as LocaleTypes[]).filter((l) => l !== 'ko').map((locale) => {
          const meta = LOCALE_META[locale];
          const isActive = locale === currentLocale;
          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              className={cn(
                "flex h-[58px] cursor-pointer items-center gap-3 rounded-xl px-2 py-4 outline-none transition-colors focus:bg-[#fafafa]",
                isActive ? "bg-[#fafafa]" : "bg-transparent hover:bg-[#fafafa]",
              )}
            >
              <span className="flex shrink-0 items-center justify-center h-6 w-6 overflow-hidden">
                {meta.icon}
              </span>
              <span className="flex-1 text-[18px] font-normal leading-[150%] text-[#181d27]">
                {meta.label}
              </span>
              {isActive && (
                <Check
                  className="size-4 shrink-0"
                  style={{ color: "#112b1d", strokeWidth: 2.5 }}
                />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
