"use client";

import { useState } from "react";
import { Check, ChevronDown, ListFilter } from "lucide-react";
import useTranslate from "@/hooks/useTranslate";
import { useSpaUrlFilters } from "@/hooks/useSpaUrlFilters";
import { cn } from "@/libs/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOptionValue =
  | { kind: "relevance" }
  | { kind: "distance" }
  | { kind: "price_asc" }
  | { kind: "discount_desc" }
  | { kind: "rating" };

const SORT_OPTIONS: { value: SortOptionValue; labelKey: string }[] = [
  { value: { kind: "relevance" }, labelKey: "sort_relevance" },
  { value: { kind: "distance" }, labelKey: "sort_nearest" },
  { value: { kind: "price_asc" }, labelKey: "sort_price_asc" },
  { value: { kind: "discount_desc" }, labelKey: "sort_discount_desc" },
  { value: { kind: "rating" }, labelKey: "sort_rating_desc" },
];

function getCurrentKind(filters: {
  priceSort?: "asc" | "desc";
  sortBy?: "rating" | "distance" | "discount_desc";
}): SortOptionValue["kind"] {
  // priceSort (cơ chế cũ, vẫn hoạt động qua chip "Giá") được ưu tiên hiện
  // trạng thái nếu đang set — đảm bảo dropdown mới và chip "Giá" cũ luôn
  // đồng bộ hiển thị, không lệch nhau
  if (filters.priceSort === "asc") return "price_asc";
  if (filters.sortBy) return filters.sortBy;
  return "relevance";
}

export function FilterSort() {
  const t = useTranslate("filter");
  const { filters, commit } = useSpaUrlFilters();
  const [open, setOpen] = useState(false);

  const currentKind = getCurrentKind(filters);
  const currentOption =
    SORT_OPTIONS.find((o) => o.value.kind === currentKind) ?? SORT_OPTIONS[0]!;

  const handleSelect = (value: SortOptionValue) => {
    if (value.kind === "price_asc") {
      commit({ ...filters, priceSort: "asc", sortBy: undefined });
    } else if (value.kind === "relevance") {
      commit({ ...filters, priceSort: undefined, sortBy: undefined });
    } else {
      commit({ ...filters, priceSort: undefined, sortBy: value.kind });
    }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-[34px] shrink-0 flex-none items-center gap-1.5 rounded-full border border-[#DDE4D9] bg-white px-3.5 py-1.5 text-left text-[13px] font-medium text-[#093E06] transition-colors hover:bg-[#F5F7F4] focus:outline-none cursor-pointer"
        >
          <ListFilter className="size-3.5 text-[#093E06] shrink-0" />
          <span className="hidden md:inline text-[#667085] font-normal">
            {t("sort_prefix" as any) || "Sắp xếp:"}
          </span>
          <span className="font-medium text-[#093E06] whitespace-nowrap">
            {t(currentOption.labelKey as Parameters<typeof t>[0])}
          </span>
          <ChevronDown
            className={cn(
              "size-3 text-[#5B6B58] transition-transform duration-200 stroke-[2.5]",
              open && "rotate-180",
            )}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {SORT_OPTIONS.map((option) => {
          const isActive = option.value.kind === currentKind;
          return (
            <DropdownMenuItem
              key={option.labelKey}
              onClick={() => handleSelect(option.value)}
              className={cn(
                "flex items-center justify-between text-sm",
                isActive && "font-medium text-[#5B7A4F]",
              )}
            >
              {t(option.labelKey as Parameters<typeof t>[0])}
              {isActive && <Check className="size-4 text-[#5B7A4F]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
