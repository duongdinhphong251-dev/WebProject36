"use client";

import { Drawer } from "@/components/ui/drawer/Drawer";
import { useSpaUrlFilters } from "@/hooks/useSpaUrlFilters";
import useTranslate from "@/hooks/useTranslate";

interface FilterDrawerRatingProps {
  open: boolean;
  onClose: () => void;
}

const RATING_OPTIONS = [0, 1, 2, 3, 4, 5] as const;

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 1.5L11.163 6.44L16.5 7.15L12.75 10.79L13.726 16.1L9 13.45L4.274 16.1L5.25 10.79L1.5 7.15L6.837 6.44L9 1.5Z"
        fill={filled ? "#FBBF24" : "none"}
        stroke={filled ? "#FBBF24" : "#d5d7da"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FilterDrawerRating({ open, onClose }: FilterDrawerRatingProps) {
  const t = useTranslate("filter");
  const { filters, commit } = useSpaUrlFilters();
  const currentRating = filters.minRating || 0;

  const handleSelect = (rating: number) => {
    commit({ ...filters, minRating: rating });
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title={t("rating")}>
      <div style={{ padding: "16px" }}>
        {RATING_OPTIONS.map((rating) => {
          const isActive = currentRating === rating;
          const label =
            rating === 0
              ? t("all")
              : `${rating} ${rating === 1 ? t("star") : t("stars")}`;

          return (
            <button
              key={rating}
              type="button"
              onClick={() => handleSelect(rating)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                textAlign: "left",
                padding: "14px 16px",
                borderRadius: "12px",
                border: `1.5px solid ${isActive ? "#5B7A4F" : "#e9eaeb"}`,
                background: isActive ? "#E6EBE4" : "#ffffff",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: isActive ? 500 : 400,
                color: isActive ? "#5B7A4F" : "#0a0d12",
                marginBottom: "8px",
                transition: "background 150ms, border-color 150ms",
              }}
            >
              {/* Stars row */}
              {rating > 0 && (
                <span
                  style={{ display: "flex", gap: "2px", alignItems: "center" }}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <StarIcon key={i} filled={i < rating} />
                  ))}
                </span>
              )}
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </Drawer>
  );
}
