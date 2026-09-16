"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft } from "lucide-react";
import type { BreadcrumbItemDto } from "@/types/api";

interface BreadcrumbsProps {
  items: BreadcrumbItemDto[];
  className?: string;
}

/**
 * Breadcrumbs — Client Component for visual breadcrumb UI.
 * Follows Figma spec (node 5:3917):
 *   - Home icon + inactive links: Gray/400 #a4a7ae
 *   - Separator chevron-right: Gray/400 #a4a7ae, 16px
 *   - Current (last) item: Gray/700 #414651, font-medium
 * JSON-LD is handled separately in BreadcrumbsJsonLd (Server Component).
 */
export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const router = useRouter();

  if (!items || items.length === 0) return null;

  const currentItem = items[items.length - 1];

  return (
    <nav aria-label="breadcrumb" className={`overflow-hidden ${className}`}>
      {/* Desktop view */}
      <ol className="hidden md:flex min-w-0 items-center overflow-hidden whitespace-nowrap">
        {items.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === items.length - 1;
          const itemKey = `${index}-${item.url}-${item.label}`;

          return (
            <li
              key={itemKey}
              className={`flex min-w-0 items-center ${isLast ? "flex-1" : "shrink-0"}`}
            >
              {/* Separator — skip before first item */}
              {!isFirst && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 mx-1 text-[#5B6B58]"
                  aria-hidden="true"
                />
              )}

              {/* Link or current page */}
              {isLast ? (
                <span
                  className="block truncate text-[12.5px] font-semibold text-[#093E06]"
                  aria-current="page"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="inline-flex max-w-[140px] items-center truncate text-[12.5px] text-[#5B6B58] transition-colors hover:text-[#093E06] md:max-w-[200px]"
                  title={item.label}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile view */}
      <div className="flex min-w-0 items-center gap-3 md:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#f0f5f2] text-[#414651] transition-colors hover:bg-[#E6EBE4]"
          aria-label="Go back"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <div className="flex min-w-0 flex-1">
          <span className="truncate text-lg font-medium text-[#0a0d12]" title={currentItem?.label}>
            {currentItem?.label}
          </span>
        </div>
      </div>
    </nav>
  );
}
