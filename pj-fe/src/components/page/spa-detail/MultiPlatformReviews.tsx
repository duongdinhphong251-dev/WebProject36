"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/libs/utils";
import useTranslate from "@/hooks/useTranslate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";

interface ReviewItem {
  quote: string;
  by: string;
  rating?: number;
  languageCode?: string | null;
  source?: string | null;
  postUrl?: string | null;
}

interface MultiPlatformReviewsProps {
  spaName: string;
  googleRating: number;
  googleReviewCount: number;
  allReviews?: ReviewItem[];
  googleMapsUri?: string | null;
}

const PLATFORMS = [
  { key: "google", name: "Google", available: true },
  { key: "tripadvisor", name: "TripAdvisor", available: false },
  { key: "klook", name: "Klook", available: false },
  { key: "facebook", name: "Facebook", available: false },
  { key: "tiktok", name: "TikTok", available: false },
  { key: "youtube", name: "YouTube", available: false },
  { key: "reddit", name: "Reddit", available: false },
] as const;

const LANG_LABEL_MAP: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "English",
  ko: "한국어",
  ja: "日本語",
  zh: "中文",
  "zh-cn": "简体中文",
  "zh-tw": "繁體中文",
  fr: "Français",
  de: "Deutsch",
  ru: "Русский",
  th: "ไทย",
  es: "Español",
};

export function MultiPlatformReviews({
  spaName,
  googleRating,
  googleReviewCount,
  allReviews,
  googleMapsUri,
}: MultiPlatformReviewsProps) {
  const t = useTranslate("spa-detail");
  const [active, setActive] = useState<string>("google");
  const [selectedLang, setSelectedLang] = useState<string>("all");

  const dynamicPlatforms = useMemo(() => {
    const hasSource = new Set<string>();
    (allReviews || []).forEach(r => {
      if (r.source) hasSource.add(r.source);
    });
    return PLATFORMS.map(p => ({
      ...p,
      available: p.key === "google" || hasSource.has(p.key) || hasSource.has(p.name) || hasSource.has(p.name.toLowerCase())
    }));
  }, [allReviews]);

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (allReviews || []).forEach(r => {
      let source = (r.source || "google").toLowerCase();
      if (source.includes("google")) source = "google";
      counts[source] = (counts[source] || 0) + 1;
    });
    return counts;
  }, [allReviews]);

  const activePlatform = dynamicPlatforms.find((p) => p.key === active) || dynamicPlatforms[0]!;

  const platformReviews = useMemo(() => {
    return (allReviews || []).filter(r => {
      if (!r.quote || !r.quote.trim()) return false;

      const source = r.source?.toLowerCase();
      if (active === "google") {
        return !source || source.includes("google");
      }
      return source === active;
    });
  }, [allReviews, active]);

  // ── Tính động danh sách ngôn ngữ có thật trong reviews ──────────────────────
  const availableLangCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const r of platformReviews) {
      const code = r.languageCode?.trim().toLowerCase();
      if (code) {
        codes.add(code);
      }
    }
    return Array.from(codes);
  }, [platformReviews]);

  const langOptions = useMemo(() => {
    const options = [
      { key: "all", label: t("all_languages") || "Tất cả ngôn ngữ" },
    ];
    for (const code of availableLangCodes) {
      options.push({
        key: code,
        label: LANG_LABEL_MAP[code] || code.toUpperCase(),
      });
    }
    return options;
  }, [availableLangCodes, t]);

  // ── Lọc review theo ngôn ngữ đã chọn và lấy max 5 đánh giá cao nhất ──
  const activeReviews = useMemo(() => {
    let filtered = platformReviews;
    if (selectedLang !== "all") {
      filtered = platformReviews.filter(
        (r) => (r.languageCode || "").trim().toLowerCase() === selectedLang.toLowerCase()
      );
    }
    
    return [...filtered]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
  }, [platformReviews, selectedLang]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(9,62,6,0.07)] sm:p-5">
      <div className="flex flex-row items-baseline justify-between gap-2">
        <h2 className="text-[15px] sm:text-lg font-bold text-[#093E06]">
          {t("multi_platform_reviews") || "Đánh giá từ nhiều nền tảng"}
        </h2>
        <span className="text-[11.5px] sm:text-xs text-[#5B6B58]">
          {googleReviewCount} {t("reviews") || "đánh giá"}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {dynamicPlatforms.map((p) => {
          const isActive = active === p.key;
          return (
            <button
              key={p.key}
              type="button"
              disabled={!p.available}
              onClick={() => p.available && setActive(p.key)}
              className={cn(
                "flex flex-none flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs transition-all",
                !p.available && "cursor-not-allowed opacity-40",
                isActive && p.available
                  ? "border-[#40813D] bg-[#F5F7F4]"
                  : "border-[#DDE4D9] bg-white",
              )}
            >
              <span className="font-semibold text-[#093E06]">{p.name}</span>
              <span className="text-[#5B6B58]">
                {p.key === "google"
                  ? Number(googleRating || 0).toFixed(1)
                  : p.available && platformCounts[p.key]
                    ? `${platformCounts[p.key]} ${t("reviews") || "đánh giá"}`
                    : t("no_data") || "Chưa có dữ liệu"}
              </span>
            </button>
          );
        })}
      </div>

      {activeReviews.length > 0 ? (
        <div className="flex flex-col gap-3">
          {activeReviews.map((review, idx) => (
            <div key={idx} className="flex flex-col gap-2 rounded-xl bg-[#DDE4D9] p-4">
              <div className="flex items-center gap-1">
                {activePlatform.key !== "reddit" && Array.from({ length: 5 }).map((_, i) => {
                  const isFilled = i < Math.round(review.rating || 5);
                  return (
                    <Star 
                      key={i} 
                      className={cn("size-3", isFilled ? "fill-[#F5B816] text-[#F5B816]" : "fill-transparent text-[#9BA898]")} 
                    />
                  );
                })}
              </div>
              <p className="text-sm leading-relaxed text-[#093E06] whitespace-pre-line">
                &ldquo;{review.quote}&rdquo;
              </p>
              <p className="text-xs text-[#5B6B58]">{review.by} · via {activePlatform.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-[#DDE4D9] p-4 text-sm text-[#5B6B58]">
          {selectedLang !== "all"
            ? t("no_reviews_for_language") || "Chưa có đánh giá bằng ngôn ngữ này."
            : t("no_review_yet") || "Chưa có đánh giá nổi bật để hiển thị."}
        </div>
      )}

      {/* Buttons matching Mockup 2b */}
      <div className="flex gap-2.5 pt-1">
        <a
          href={
            activePlatform.key === "reddit"
              ? activeReviews[0]?.postUrl || `https://www.reddit.com/search/?q=${encodeURIComponent(spaName)}`
              : activePlatform.key === "google" && googleMapsUri
                ? googleMapsUri
                : `https://www.google.com/search?q=${encodeURIComponent(spaName)}+reviews`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[#DDE4D9] px-2 text-center text-[12.5px] sm:text-[13px] font-semibold text-[#093E06] hover:bg-[#F5F7F4] transition-colors"
        >
          <span className="truncate">
            {activePlatform.key === "google" 
              ? (t("view_all_on_google") || "Xem tất cả trên Google") 
              : activePlatform.key === "reddit"
                ? (t("view_post_on_reddit") || "Xem bài viết trên Reddit")
                : (t("view_all_on_platform", { platform: activePlatform.name }) || `Xem tất cả trên ${activePlatform.name}`)}
          </span>
        </a>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-11 flex-1 items-center justify-center px-2 text-center rounded-xl border border-[#DDE4D9] text-[12.5px] sm:text-[13px] font-semibold text-[#093E06] hover:bg-[#F5F7F4] transition-colors cursor-pointer"
            >
              <span className="truncate">{t("filter_by_language") || "Lọc theo ngôn ngữ"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white p-1 rounded-xl shadow-lg border border-[#DDE4D9]">
            {langOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.key}
                onClick={() => setSelectedLang(opt.key)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-[13px] font-medium text-[#093E06] hover:bg-[#F5F7F4] rounded-lg cursor-pointer",
                  selectedLang === opt.key && "text-[#40813D] font-semibold",
                )}
              >
                <span>{opt.label}</span>
                {selectedLang === opt.key && <Check className="size-4 text-[#40813D]" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
