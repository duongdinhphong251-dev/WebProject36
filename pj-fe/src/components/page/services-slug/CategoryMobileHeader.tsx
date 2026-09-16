"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import LocaleSwitcher from "@/components/common/locale-switcher";
import SearchBox from "@/components/layouts/main/header/SearchBox";
import type { LocaleTypes } from "@/i18n/settings";

interface CategoryMobileHeaderProps {
  title: string;
  total?: number;
  locationText?: string;
  locale: LocaleTypes;
}

export function CategoryMobileHeader({
  title,
  total,
  locationText,
}: CategoryMobileHeaderProps) {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#40813D] px-4 py-2.5 text-white md:hidden shadow-sm">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Back button + Title & subtitle */}
        <div className="flex flex-1 items-center gap-2.5 overflow-hidden">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 transition-colors hover:bg-white/25 active:scale-95 text-white cursor-pointer"
            aria-label="Quay lại"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex min-w-0 flex-col justify-center">
            <h1 className="truncate text-[16px] font-bold leading-tight text-white">
              {title}
            </h1>
            <p className="truncate text-[11.5px] font-normal text-white/85 leading-tight mt-0.5">
              {total !== undefined ? `${total} địa điểm` : ""}
              {locationText ? ` · ${locationText}` : ""}
            </p>
          </div>
        </div>

        {/* Right: Search + Language switcher */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 transition-colors hover:bg-white/25 active:scale-95 text-white cursor-pointer"
            aria-label="Tìm kiếm"
          >
            <Search className="size-4" />
          </button>
          <LocaleSwitcher variant="mobile-globe" />
        </div>
      </div>

      {/* Mobile Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-4 flex items-start"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full flex items-center pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1">
                <SearchBox autoFocus />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
