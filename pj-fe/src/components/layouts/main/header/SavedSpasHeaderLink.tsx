"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Bookmark } from "lucide-react";
import { useSavedSpas } from "@/hooks/useSavedSpas";
import { cn } from "@/libs/utils";
import { useTranslation } from "@/i18n/client";
import type { LocaleTypes } from "@/i18n/settings";

interface SavedSpasHeaderLinkProps {
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
}

export function SavedSpasHeaderLink({
  className,
  iconClassName = "w-5 h-5",
  showLabel = false,
}: SavedSpasHeaderLinkProps) {
  const params = useParams();
  const locale = (params?.locale as LocaleTypes) || "vi";
  const { count } = useSavedSpas();
  const { t } = useTranslation(locale, "main-menu");

  return (
    <Link
      href={`/${locale}/saved-spas`}
      aria-label={`Trang Spa đã lưu (${count} spa)`}
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 p-2 rounded-full text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        className,
      )}
    >
      <Bookmark className={cn("shrink-0", iconClassName)} />
      {showLabel && (
        <span className="text-[13.5px] font-medium text-[#E8FDE7]">
          {t("saved_places") !== "saved_places" 
            ? t("saved_places") 
            : locale === "ko" ? "저장된 장소" 
            : locale === "en" ? "Saved places" 
            : "Địa điểm đã lưu"}
        </span>
      )}
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d92d20] px-1 text-[10px] font-bold text-white shadow-xs">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
