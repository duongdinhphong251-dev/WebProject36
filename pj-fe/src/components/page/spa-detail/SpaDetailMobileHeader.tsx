"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface SpaDetailMobileHeaderProps {
  name: string;
  categoryName?: string | null;
  districtName?: string | null;
  cityName?: string | null;
  spaId?: string | number;
}

export function SpaDetailMobileHeader({
  name,
  categoryName,
  districtName,
  cityName,
  spaId: _spaId,
}: SpaDetailMobileHeaderProps) {
  const router = useRouter();

  const subline = [categoryName, districtName || cityName].filter(Boolean).join(" · ");

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex md:hidden items-center gap-1.5 bg-[#40813D] px-2.5 py-2 text-white shadow-sm">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Quay lại"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 transition-colors hover:bg-white/25 active:bg-white/30"
      >
        <ChevronLeft className="size-5 text-white stroke-[2.5]" />
      </button>

      {/* Spa Title & Subtitle */}
      <div className="flex flex-1 min-w-0 flex-col justify-center">
        <h1 className="truncate text-[14px] font-semibold leading-tight text-white">
          {name}
        </h1>
        {subline && (
          <span className="truncate text-[11px] font-normal leading-normal text-[#E8FDE7]">
            {subline}
          </span>
        )}
      </div>
      </header>
      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-[56px] md:hidden shrink-0" aria-hidden="true" />
    </>
  );
}
