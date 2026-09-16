"use client";

import { useSavedSpas } from "@/hooks/useSavedSpas";
import { cn } from "@/libs/utils";
import { Bookmark } from "lucide-react";

interface SaveSpaButtonProps {
  spaId?: string | number | null;
  className?: string;
  iconClassName?: string;
  size?: number;
}

export function SaveSpaButton({
  spaId,
  className,
  iconClassName,
  size = 18,
}: SaveSpaButtonProps) {
  const { isSaved, toggleSaveSpa } = useSavedSpas();

  if (!spaId) return null;

  const saved = isSaved(spaId);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaveSpa(spaId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? "Bỏ lưu Spa" : "Lưu Spa"}
      className={cn(
        "flex items-center justify-center rounded-full p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B7A4F]",
        saved
          ? "bg-[#E6EBE4] text-[#5B7A4F] hover:bg-[#D6DDD3]"
          : "bg-white/80 backdrop-blur-sm text-[#414651] hover:bg-white hover:text-[#5B7A4F] shadow-sm",
        className,
      )}
    >
      <Bookmark
        size={size}
        className={cn(
          "transition-all duration-200",
          saved
            ? "fill-[#5B7A4F] text-[#5B7A4F] scale-110"
            : "text-current",
          iconClassName,
        )}
      />
    </button>
  );
}
