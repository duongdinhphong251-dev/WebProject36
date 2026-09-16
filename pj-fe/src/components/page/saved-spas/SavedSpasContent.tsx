"use client";

import type { SpaDetailDto } from "@/types/api";
import { useEffect, useState } from "react";
import { useSavedSpas } from "@/hooks/useSavedSpas";
import { getSpaBySlug } from "@/services/api/spa-api";
import { SaveSpaButton } from "@/components/common/save-spa-button/SaveSpaButton";
import CustomLink from "@/components/common/link";
import { Container } from "@/components/ui/container";
import { Bookmark, MapPin, Star, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";

import { useTranslation } from "@/i18n/client";
import type { LocaleTypes } from "@/i18n/settings";

const FALLBACK_THUMB = "/assets/images/common/logo_x.png";

function SavedSpaCard({ spa, locale = "vi" }: { spa: SpaDetailDto; locale?: string }) {
  const { t } = useTranslation((locale as LocaleTypes) || "vi", "spa-detail");
  const thumbnail = (typeof spa.photos?.[0] === 'string' ? spa.photos[0] : null) || FALLBACK_THUMB;

  return (
    <div className="relative flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-white border border-[#e9eaeb] shadow-xs hover:shadow-md transition-shadow">
      {/* Save Button top-right */}
      <div className="absolute top-3 right-3 z-10">
        <SaveSpaButton spaId={spa.slug || spa.id} />
      </div>

      {/* Image */}
      <div className="relative w-full sm:w-40 h-40 shrink-0 rounded-xl overflow-hidden bg-gray-100">
        <Image
          src={thumbnail}
          alt={spa.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 160px"
        />
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0 pr-8 sm:pr-0">
        <div>
          <CustomLink href={`/provider/${spa.slug || spa.id}`}>
            <h3 className="text-base font-semibold text-[#0a0d12] hover:text-[#5B7A4F] transition-colors line-clamp-1">
              {spa.name}
            </h3>
          </CustomLink>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1.5 mb-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-[#414651]">
                {spa.ratingValue ? Number(spa.ratingValue || 0).toFixed(1) : "5.0"}
              </span>
              <Star className="w-3.5 h-3.5 fill-[#fac415] text-[#fac415]" />
            </div>
            {spa.reviewCount ? (
              <span className="text-xs text-[#6b7280]">
                ({spa.reviewCount} {t("reviews") || "đánh giá"})
              </span>
            ) : null}
          </div>

          {/* Address */}
          {(spa.address || spa.location?.cityName) && (
            <div className="flex items-start gap-1.5 text-xs text-[#535862] line-clamp-2">
              <MapPin className="w-3.5 h-3.5 text-[#6b7280] shrink-0 mt-0.5" />
              <span>{spa.address || spa.location?.cityName}</span>
            </div>
          )}
        </div>

        {/* Footer link */}
        <div className="mt-4 pt-3 border-t border-[#f0f0f0] flex items-center justify-between">
          <span className="text-xs font-medium text-[#5B7A4F]">
            {spa.deals?.length
              ? t("deals_available", { count: spa.deals.length }) || `${spa.deals.length} ưu đãi khả dụng`
              : t("view_spa_details") || "Xem chi tiết spa"}
          </span>
          <CustomLink
            href={`/provider/${spa.slug || spa.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B7A4F] hover:underline"
          >
            <span>{t("view_now") || "Xem ngay"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </CustomLink>
        </div>
      </div>
    </div>
  );
}

export function SavedSpasContent({ locale = "vi" }: { locale?: string }) {
  const { t } = useTranslation((locale as LocaleTypes) || "vi", "spa-detail");
  const { savedSpaIds } = useSavedSpas();
  const [spas, setSpas] = useState<SpaDetailDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const savedSpaIdsKey = savedSpaIds.join(",");

  useEffect(() => {
    if (!mounted) return;

    if (savedSpaIds.length === 0) {
      setSpas([]);
      setLoading(false);
      return;
    }

    let isCancelled = false;
    setLoading(true);

    Promise.allSettled(savedSpaIds.map((id) => getSpaBySlug(id, { locale })))
      .then((results) => {
        if (isCancelled) return;
        const validSpas: SpaDetailDto[] = [];
        results.forEach((res) => {
          if (res.status === "fulfilled" && res.value) {
            validSpas.push(res.value);
          }
        });
        setSpas(validSpas);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [savedSpaIdsKey, mounted, locale]);

  // Don't render until mounted to prevent SSR hydration mismatch with localStorage
  if (!mounted) {
    return (
      <Container maxWidth="2xl" className="py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-md w-48" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="2xl" className="py-6 sm:py-8 min-h-[60vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e9eaeb]">
        <div className="flex items-center gap-2">
          <Bookmark className="w-6 h-6 fill-[#5B7A4F] text-[#5B7A4F]" />
          <h1 className="text-xl font-bold text-[#0a0d12]">{t("saved_spas_title") || "Spa đã lưu"}</h1>
        </div>
        <span className="text-sm font-medium text-[#535862]">
          {savedSpaIds.length} {t("saved_spas_title") || "Spa đã lưu"}
        </span>
      </div>

      {/* Empty State */}
      {savedSpaIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-[#f0f0f0] shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#E6EBE4] flex items-center justify-center mb-4">
            <Bookmark className="w-8 h-8 text-[#5B7A4F] fill-[#5B7A4F]" />
          </div>
          <h2 className="text-lg font-semibold text-[#0a0d12] mb-1">
            {t("no_saved_spas_title") || "Chưa có Spa nào được lưu"}
          </h2>
          <p className="text-sm text-[#535862] max-w-md mb-6">
            {t("no_saved_spas_desc") || "Nhấn vào biểu tượng dấu trang ở các thẻ Spa để lưu lại danh sách yêu thích và truy cập nhanh bất cứ lúc nào."}
          </p>
          <CustomLink
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B7A4F] text-white font-medium text-sm hover:bg-[#4a6540] transition-colors shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t("explore_now") || "Khám phá ngay"}</span>
          </CustomLink>
        </div>
      ) : loading ? (
        /* Loading Skeleton */
        <div className="space-y-4">
          {Array.from({ length: Math.min(savedSpaIds.length, 3) }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-36 bg-gray-100 rounded-2xl border border-gray-200"
            />
          ))}
        </div>
      ) : spas.length === 0 ? (
        /* Fallback if APIs failed or returned null */
        <div className="py-12 text-center text-sm text-gray-500">
          Không thể tải thông tin chi tiết các spa đã lưu. Vui lòng thử lại sau.
        </div>
      ) : (
        /* Spa List */
        <div className="space-y-4">
          {spas.map((spa) => (
            <SavedSpaCard key={spa.id || spa.slug} spa={spa} locale={locale} />
          ))}
        </div>
      )}
    </Container>
  );
}
