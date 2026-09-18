"use client";

import type {
  FlashSaleDto,
  PaginationMetaDto,
  SpaDealsGroupDto,
} from "@/types/api";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Search from "lucide-react/dist/esm/icons/search";
import Link from "next/link";
import { SpaDealsCard } from "./SpaDealsCard";
import { SpaDealFeaturedCard } from "./SpaDealFeaturedCard";
import { PaginationControls } from "./PaginationControls";
import { SpaDealItem } from "./SpaDealItem";
import useTranslate from "@/hooks/useTranslate";

// Tăng số này mỗi khi cấu trúc SpaDealsGroupDto/SpaBasicDto thay đổi field
// quan trọng — đảm bảo cache cũ tự động bị bỏ qua thay vì đè lên data mới
const LISTING_CACHE_VERSION = 4;

type ScrollState = {
  version: number;
  groups: SpaDealsGroupDto[];
  pagination: PaginationMetaDto;
  scrollY: number;
};

function readScrollState(key: string): ScrollState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScrollState;
    if (parsed.version !== LISTING_CACHE_VERSION) {
      // Cache cũ không khớp version hiện tại — xoá luôn, không dùng
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveScrollState(key: string, state: ScrollState) {
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // sessionStorage quota exceeded — ignore
  }
}

type Props = {
  initialGroups: SpaDealsGroupDto[];
  initialPagination: PaginationMetaDto;
  locale: string;
  resolveUrl: string;
  lat?: number;
  lng?: number;
  flashSale?: FlashSaleDto;
  flashSaleHub?: boolean;
};

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function InfiniteSpaDealsListing({
  initialGroups,
  initialPagination,
  locale,
  resolveUrl,
  lat,
  lng,
  flashSale,
  flashSaleHub: _flashSaleHub = false,
}: Props) {
  const t = useTranslate("services-slug");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Key dùng cho sessionStorage — gắn với URL đầy đủ (ngoại trừ param "page" để tránh hỏng cache/scroll-restore)
  const cleanSearchParams = new URLSearchParams(searchParams.toString());
  cleanSearchParams.delete("page");
  const stateKey = `__listing_state__${pathname}?${cleanSearchParams.toString()}`;

  // Track whether sessionStorage was restored — skip server-props reset on first render
  const restoredFromCache = useRef(false);

  // Always start with server-provided initialGroups — avoids hydration mismatch.
  // sessionStorage may contain stale GCS signed URLs (different from SSR output),
  // which would cause src/srcSet mismatches between server HTML and client render.
  const [groups, setGroups] = useState<SpaDealsGroupDto[]>(initialGroups);
  const [pagination, setPagination] = useState<PaginationMetaDto>(initialPagination);

  // Restore from sessionStorage AFTER hydration (back navigation UX)
  useEffect(() => {
    const saved = readScrollState(stateKey);
    if (saved && (saved.groups.length > 0 || initialGroups.length === 0)) {
      restoredFromCache.current = true;
      setGroups(saved.groups);
      setPagination(saved.pagination);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty: only on mount

  // Khi server props thay đổi (filter mới) → reset về server data
  // Bỏ qua lần mount đầu tiên nếu đã restore từ sessionStorage
  useEffect(() => {
    if (restoredFromCache.current) {
      restoredFromCache.current = false;
      return;
    }
    setGroups(initialGroups);
    setPagination(initialPagination);
  }, [initialGroups, initialPagination]);

  // Ref để access giá trị mới nhất trong cleanup function
  const groupsRef = useRef(groups);
  const paginationRef = useRef(pagination);
  useEffect(() => { groupsRef.current = groups; }, [groups]);
  useEffect(() => { paginationRef.current = pagination; }, [pagination]);

  // ── Desktop Navigation State (Next.js RSC Navigation + useTransition) ────────────
  const [isPending, startTransition] = useTransition();
  const desktopGridTopRef = useRef<HTMLDivElement | null>(null);

  // Restore scroll position sau khi content render (back navigation)
  useEffect(() => {
    const saved = readScrollState(stateKey);
    if (!saved || saved.scrollY <= 0) return;
    const timer = setTimeout(() => {
      window.scrollTo({ top: saved.scrollY, behavior: "instant" });
    }, 80);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ chạy 1 lần khi mount

  // Lưu state + scroll liên tục khi user scroll (debounce 300ms)
  useEffect(() => {
    let debounceId: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(debounceId);
      debounceId = setTimeout(() => {
        saveScrollState(stateKey, {
          version: LISTING_CACHE_VERSION,
          groups: groupsRef.current,
          pagination: paginationRef.current,
          scrollY: window.scrollY,
        });
      }, 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(debounceId);
      window.removeEventListener("scroll", handleScroll);
      // Lưu ngay khi unmount (navigate đi) để đảm bảo không mất data
      saveScrollState(stateKey, {
        version: LISTING_CACHE_VERSION,
        groups: groupsRef.current,
        pagination: paginationRef.current,
        scrollY: window.scrollY,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateKey]);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Ref guard tránh stale closure — isLoadingMore trong useCallback luôn đọc giá trị mới nhất
  const isLoadingMoreRef = useRef(false);
  /** endsAt = windowEndsAt; không gắn với flashSale.isActive (Home top 10). */
  const sharedCountdownEndAt = flashSale?.endsAt ?? null;

  const hasMore = pagination.page < pagination.totalPages;
  const nextPage = pagination.page + 1;

  const resolveApiUrl = useMemo(() => {
    const base =
      process.env.NEXT_PUBLIC_API ?? process.env.NEXT_PUBLIC_API_DOMAIN ?? "";
    if (!base) return "";

    const query = new URLSearchParams({
      url: resolveUrl.replace(/^\//, ""),
      locale,
      page: String(nextPage),
      limit: String(pagination.limit),
    });
    if (isFiniteNumber(lat) && isFiniteNumber(lng)) {
      query.set("lat", String(lat));
      query.set("lng", String(lng));
    }
    const priceSort = searchParams.get("priceSort");
    const sortByParam = searchParams.get("sortBy");
    if (priceSort === "asc") query.set("sort", "price_asc");
    else if (priceSort === "desc") query.set("sort", "price_desc");
    else if (sortByParam) query.set("sort", sortByParam);
    const minRating = searchParams.get("minRating");
    if (minRating) query.set("minRating", minRating);
    const isOpenNow = searchParams.get("isOpenNow");
    if (isOpenNow === "true") query.set("isOpenNow", "true");
    const minPrice = searchParams.get("minPrice");
    if (minPrice) query.set("minPrice", minPrice);
    const maxPrice = searchParams.get("maxPrice");
    if (maxPrice) query.set("maxPrice", maxPrice);
    return `${base}/api/v1/pages/resolve?${query.toString()}`;
  }, [lat, lng, locale, nextPage, pagination.limit, resolveUrl, searchParams]);

  const loadMore = useCallback(async () => {
    // Dùng ref thay vì state để tránh stale closure và tránh recreate callback
    if (!hasMore || isLoadingMoreRef.current || !resolveApiUrl) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadError(null);
    try {
      const res = await fetch(resolveApiUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as {
        data?: {
          deals?: { data?: SpaDealsGroupDto[]; meta?: PaginationMetaDto };
        };
      };
      const deals = body?.data?.deals?.data ?? [];
      const meta = body?.data?.deals?.meta;
      if (meta) setPagination(meta);
      if (deals.length > 0) {
        setGroups((prev) => [...prev, ...deals]);
      }
    } catch {
      setLoadError("load_more_failed");
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
    // isLoadingMore (state) sengaja dihapus dari deps — ref sudah menjaga re-entrancy
  }, [hasMore, resolveApiUrl]);

  useEffect(() => {
    const node = sentinelRef.current;
    // Dừng observer khi hết trang HOẶC khi có lỗi — tránh retry liên tục
    if (!node || !hasMore || loadError) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadError, loadMore]);

  if (groups.length === 0) {
    const suggestions = (flashSale?.deals ?? []).filter(Boolean).slice(0, 3);
    return (
      <section className="w-full flex flex-col items-center pb-12 mt-4 relative">
        {/* Empty state container */}
        <div className="relative flex flex-col items-center justify-center pt-[100px] pb-[80px] w-full max-w-[480px] mx-auto overflow-hidden">
          {/* Background pattern decorative (concentric circles) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[calc(50%+40px)] pointer-events-none w-[480px] h-[480px] flex items-center justify-center">
            {/* Concentric circles using pure CSS borders to approximate mask */}
            <div className="absolute w-[160px] h-[160px] rounded-full border border-[#000000] opacity-[0.03]" />
            <div className="absolute w-[240px] h-[240px] rounded-full border border-[#000000] opacity-[0.03]" />
            <div className="absolute w-[320px] h-[320px] rounded-full border border-[#000000] opacity-[0.03]" />
            <div className="absolute w-[400px] h-[400px] rounded-full border border-[#000000] opacity-[0.03]" />
            <div className="absolute w-[480px] h-[480px] rounded-full border border-[#000000] opacity-[0.03]" />
          </div>

          <div className="relative z-10 flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[rgba(0,0,0,0.4)] backdrop-blur-[4px] mb-4">
            <Search className="h-6 w-6 text-white" strokeWidth={2} />
          </div>

          <h2 className="relative z-10 text-[16px] font-medium text-[#181d27] mb-1">
            {t("no_deals_title")}
          </h2>
          <p className="relative z-10 text-[14px] text-[#535862]">
            {t("no_deals_hint")}
          </p>
        </div>

        {/* You May Also Like */}
        {suggestions.length > 0 && (
          <div className="w-full max-w-screen-md flex flex-col gap-4 mt-2 px-4">
            <h3 className="text-[16px] font-medium text-[#0a0d12]">
              {t("you_may_also_like")}
            </h3>

            <div className="flex flex-col gap-4">
              {suggestions.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-[#fafafa] border border-[#d3d8e0] rounded-[20px] p-3 shadow-[0px_1px_3px_0px_rgba(10,13,18,0.1),0px_1px_2px_-1px_rgba(10,13,18,0.1)]"
                >
                  <SpaDealItem
                    deal={deal}
                    isLast={true}
                    sharedCountdownEndAt={sharedCountdownEndAt}
                  />
                </div>
              ))}
            </div>

            <div className="mt-2 flex justify-start">
              <Link
                href={`/${locale}/flash-sale`}
                className="inline-flex items-center justify-center gap-1 rounded-[14px] border border-[#bfe1d9] bg-[#f0f5f2] px-4 py-2.5 text-[14px] font-medium text-[#5B7A4F] transition-colors hover:bg-[#e4efe9]"
              >
                {t("view_more_deals")}
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="w-full">
      {/* Mobile view: 1 column vertical list of SpaDealsCard */}
      <div className="flex w-full flex-col space-y-4 md:hidden">
        {groups.map((group, idx) => (
          <SpaDealsCard
            key={`${group.spa.id}-${idx}`}
            spa={group.spa}
            deals={group.deals}
            sharedCountdownEndAt={sharedCountdownEndAt}
            priority={false}
          />
        ))}
      </div>

      {/* Desktop view: 3-column grid of SpaDealFeaturedCard */}
      <div ref={desktopGridTopRef} className="scroll-mt-24" />
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 relative min-h-[300px] w-full">
        {isPending && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
            <div className="w-8 h-8 border-3 border-[#40813D] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {initialGroups.map((group, idx) => (
          <SpaDealFeaturedCard
            key={`${group.spa.id}-${idx}`}
            spa={group.spa}
            deals={group.deals}
            sharedCountdownEndAt={sharedCountdownEndAt}
            priority={false}
          />
        ))}
      </div>

      {/* Desktop PaginationControls */}
      <div className="hidden md:block mt-6">
        <PaginationControls
          currentPage={initialPagination.page}
          totalPages={initialPagination.totalPages}
          disabled={isPending}
          onPageChange={(page) => {
            const params = new URLSearchParams(searchParams.toString());
            if (page <= 1) params.delete("page");
            else params.set("page", String(page));
            const q = params.toString();

            desktopGridTopRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });

            startTransition(() => {
              router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
            });
          }}
        />
      </div>

      {loadError ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center text-sm md:hidden">
          <p className="text-[#b42318]">{t("load_more_failed")}</p>
          <button
            type="button"
            onClick={() => {
              setLoadError(null);
              void loadMore();
            }}
            className="rounded-full border border-[#DDE4D9] bg-white px-4 py-1.5 text-sm font-medium text-[#5B7A4F] transition-colors hover:bg-[#F5F7F4]"
          >
            {t("retry")}
          </button>
        </div>
      ) : hasMore ? (
        <div
          ref={sentinelRef}
          className="py-6 text-center text-sm text-[#1c3029] md:hidden"
        >
          {isLoadingMore ? t("loading") : t("scroll_to_load_more")}
        </div>
      ) : (
        <div className="py-6 text-center text-sm text-[#1c3029] md:hidden">
          {t("loaded_all_results")}
        </div>
      )}
    </section>
  );
}
