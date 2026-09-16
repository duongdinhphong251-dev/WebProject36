"use client";

import { useEffect, useState } from "react";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!visible) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6 flex size-11 items-center justify-center rounded-full bg-[#40813D] text-white shadow-lg transition-all duration-200 hover:bg-[#346a32] focus:outline-none focus:ring-2 focus:ring-[#40813D] focus:ring-offset-2 cursor-pointer"
    >
      <ChevronUp className="size-6 stroke-[2.5]" />
    </button>
  );
}
