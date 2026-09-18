"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import LogoMain from "../Logo";
import SearchBox from "../SearchBox";
import { cn } from "@/libs/utils";

export default function MainMenu() {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const isHomePage = pathname === "/" || /^\/[a-z]{2}$/.test(pathname);
  const isDetailPage = pathname.includes("/provider/") || pathname.includes("/organization_services/");
  const isListingPage = !!params?.serviceSlug && !isDetailPage;

  useEffect(() => {
    setShowMobileSearch(false);
  }, [pathname]);

  return (
    <header className={cn("bg-[#40813D] text-white", (isDetailPage || isListingPage) && "max-md:hidden")}>
      <div className="mx-auto max-w-[1560px] px-4 md:px-12 xl:px-[80px]">
        <div className="flex h-14 md:h-[70px] items-center justify-between gap-4 py-0 md:gap-6">
          <div className="flex items-center shrink-0">
            <LogoMain />
          </div>

          <div className="hidden md:flex flex-1 max-w-[420px] items-center">
            <SearchBox />
          </div>

          <div className="hidden items-center justify-end gap-3 flex-1 md:flex" />

          <div className="flex items-center gap-2 md:hidden">
            {!isHomePage && !isDetailPage && (
              <button
                type="button"
                className="flex items-center justify-center h-10 w-10 rounded-xl shrink-0 bg-white/15 hover:bg-white/25 text-white transition-colors"
                onClick={() => setShowMobileSearch(true)}
                aria-label="search"
              >
                <Search className="h-5 w-5" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {isHomePage && (
          <div className="md:hidden pb-3.5 pt-0.5">
            <SearchBox />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden p-4 flex items-start"
            onClick={() => setShowMobileSearch(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full flex items-center"
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
