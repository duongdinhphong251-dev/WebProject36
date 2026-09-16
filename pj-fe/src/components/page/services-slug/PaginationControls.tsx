"use client";

import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import { cn } from "@/libs/utils";

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

function getPaginationRange(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Always show first, last, and window around current page
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  className,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const pages = getPaginationRange(currentPage, totalPages);

  return (
    <nav
      aria-label="Phân trang"
      className={cn("flex items-center justify-center gap-2 py-4", className)}
    >
      {/* Nút Previous */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage <= 1}
        aria-label="Trang trước"
        className="w-10 h-10 rounded-[10px] border border-[#DDE4D9] bg-white flex items-center justify-center text-[#093E06] hover:bg-[#F5F7F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-5 h-5 stroke-[2px]" />
      </button>

      {/* Danh sách nút số trang */}
      {pages.map((page, index) => {
        if (typeof page === "string") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="w-10 h-10 flex items-center justify-center text-[#5B6B58] font-medium text-[14px] select-none"
            >
              …
            </span>
          );
        }

        const isActive = page === currentPage;

        return (
          <button
            key={`page-${page}`}
            type="button"
            onClick={() => !isActive && onPageChange(page)}
            disabled={disabled}
            aria-current={isActive ? "page" : undefined}
            aria-label={`Trang ${page}`}
            className={cn(
              "w-10 h-10 rounded-[10px] text-[14px] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
              isActive
                ? "bg-[#40813D] text-white font-semibold shadow-sm cursor-default"
                : "border border-[#DDE4D9] bg-white text-[#093E06] font-medium hover:bg-[#F5F7F4]",
            )}
          >
            {page}
          </button>
        );
      })}

      {/* Nút Next */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage >= totalPages}
        aria-label="Trang kế tiếp"
        className="w-10 h-10 rounded-[10px] border border-[#DDE4D9] bg-white flex items-center justify-center text-[#093E06] hover:bg-[#F5F7F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-5 h-5 stroke-[2px]" />
      </button>
    </nav>
  );
}
