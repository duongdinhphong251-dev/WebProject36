"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Search, Check } from "lucide-react";
import { Drawer } from "@/components/ui/drawer/Drawer";
import useTranslate from "@/hooks/useTranslate";
import { useCityList } from "@/hooks/useCityList";
import type { LocaleTypes } from "@/i18n/settings";
import type {
  CityResponseDto,
  DistrictResponseDto,
  PageFiltersDto,
  PlaceResponseDto,
} from "@/types/api";
import Link from "next/link";
import { buildSeoUrl } from "@/libs/filter-utils";
import { normalizeLocationSearchKey } from "@/libs/localize-location-name";
import {
  cityDisplayName,
  districtDisplayName,
  placeDisplayName,
} from "@/libs/parse-seo-service-path";

// ─── Client search helpers (city / district only — small lists) ───────────────

function regionSearchMatches(
  query: string,
  parts: (string | null | undefined)[],
): boolean {
  const q = normalizeLocationSearchKey(query);
  if (!q) return true;
  const tokens = q.split(" ").filter(Boolean);
  const hay = parts.map((p) => normalizeLocationSearchKey(p)).join(" ");
  if (hay.includes(q)) return true;
  return tokens.every((tok) => hay.includes(tok));
}

// ─── API fetch helpers ────────────────────────────────────────────────────────

async function fetchDistrictsByCitySlug(
  citySlug: string,
): Promise<DistrictResponseDto[]> {
  const base = process.env.NEXT_PUBLIC_API ?? "";
  const res = await fetch(
    `${base}/api/v1/locations/cities/${citySlug}/districts`,
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data ?? json ?? [];
}

interface PlacesPage {
  items: PlaceResponseDto[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

async function fetchPlacesPage(
  districtSlug: string,
  page: number,
  q: string,
  signal?: AbortSignal,
): Promise<PlacesPage> {
  const base = process.env.NEXT_PUBLIC_API ?? "";
  const params = new URLSearchParams({ page: String(page), limit: "30" });
  if (q.trim()) params.set("q", q.trim());
  const res = await fetch(
    `${base}/api/v1/locations/districts/${districtSlug}/places?${params}`,
    { signal },
  );
  if (!res.ok) return { items: [], meta: { page, limit: 30, total: 0, totalPages: 0 } };
  const json = await res.json();
  return {
    items: json?.data ?? [],
    meta: json?.meta ?? { page, limit: 30, total: 0, totalPages: 1 },
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterDrawerRegionProps {
  open: boolean;
  onClose: () => void;
  payloadFilters: PageFiltersDto;
}

type Tab = "province" | "district" | "place";

// ─── Component ────────────────────────────────────────────────────────────────

export function FilterDrawerRegion({
  open,
  onClose,
  payloadFilters,
}: FilterDrawerRegionProps) {
  const t = useTranslate("filter");
  const locale = (useParams()?.locale as LocaleTypes) ?? "vi";
  const searchParams = useSearchParams();
  const { selectCity } = useCityList();

  const getHref = (path: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    const q = params.toString();
    return q ? `${path}?${q}` : path;
  };

  const { currentService, currentCity, currentDistrict, cities = [] } =
    payloadFilters;

  // ── Tab state ──────────────────────────────────────────────────────────────
  const initialTab: Tab = currentDistrict
    ? "place"
    : currentCity
      ? "district"
      : "province";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // ── Search ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ── Districts (client-fetched, client-filtered) ────────────────────────────
  const [clientDistrictsKey, setClientDistrictsKey] = useState<string | null>(null);
  const [clientDistricts, setClientDistricts] = useState<DistrictResponseDto[] | null>(null);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // ── Places — paginated, server-searched ───────────────────────────────────
  const [places, setPlaces] = useState<PlaceResponseDto[]>([]);
  const [placesPage, setPlacesPage] = useState(1);
  const [placesTotalPages, setPlacesTotalPages] = useState(1);
  const [placesTotal, setPlacesTotal] = useState(0);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [loadingMorePlaces, setLoadingMorePlaces] = useState(false);
  const placesKeyRef = useRef<string>("");
  const placeAbortRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Track latest values without triggering effect re-runs
  const loadMoreStateRef = useRef({ page: 1, totalPages: 1, loading: false, loadingMore: false });
  // Increments after every completed fetch → forces IO to reconnect and re-evaluate sentinel visibility
  const [loadVersion, setLoadVersion] = useState(0);

  // ── Sync tab on filter change ──────────────────────────────────────────────
  useEffect(() => {
    const correctTab: Tab = currentDistrict
      ? "place"
      : currentCity
        ? "district"
        : "province";
    setActiveTab(correctTab);
  }, [currentCity?.slug, currentDistrict?.slug]);

  // ── Invalidate districts cache on city change ──────────────────────────────
  useEffect(() => {
    if (currentCity?.slug !== clientDistrictsKey) {
      setClientDistricts(null);
      setClientDistrictsKey(currentCity?.slug ?? null);
    }
  }, [currentCity?.slug]);

  // ── Cleanup debounce on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      placeAbortRef.current?.abort();
    };
  }, []);

  // ── Clear search state when Drawer closes ─────────────────────────────────
  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
    }
  }, [open]);

  // ── Place loader ───────────────────────────────────────────────────────────
  const loadPlaces = useCallback(
    async (opts: { districtSlug: string; page: number; q: string; replace: boolean }) => {

      // Abort any in-flight request
      placeAbortRef.current?.abort();
      const ctrl = new AbortController();
      placeAbortRef.current = ctrl;

      if (opts.replace) {
        setLoadingPlaces(true);
        loadMoreStateRef.current.loading = true;
      } else {
        setLoadingMorePlaces(true);
        loadMoreStateRef.current.loadingMore = true;
      }

      try {
        const { items, meta } = await fetchPlacesPage(
          opts.districtSlug,
          opts.page,
          opts.q,
          ctrl.signal,
        );
        if (opts.replace) {
          setPlaces(items);
        } else {
          setPlaces((prev) => [...prev, ...items]);
        }
        setPlacesPage(meta.page);
        setPlacesTotalPages(meta.totalPages);
        setPlacesTotal(meta.total);
        loadMoreStateRef.current.page = meta.page;
        loadMoreStateRef.current.totalPages = meta.totalPages;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        if (opts.replace) setPlaces([]);
      } finally {
        setLoadingPlaces(false);
        setLoadingMorePlaces(false);
        loadMoreStateRef.current.loading = false;
        loadMoreStateRef.current.loadingMore = false;
        // Bump version so IntersectionObserver reconnects with up-to-date totalPages
        setLoadVersion((v) => v + 1);
      }
    },
    [],
  );

  // ── Trigger initial place load when tab=place opens ───────────────────────
  useEffect(() => {
    if (activeTab === "place" && currentDistrict?.slug) {
      const key = `${currentDistrict.slug}::${debouncedSearch}`;
      if (placesKeyRef.current !== key) {
        placesKeyRef.current = key;
        setPlaces([]);
        loadPlaces({
          districtSlug: currentDistrict.slug,
          page: 1,
          q: debouncedSearch,
          replace: true,
        });
      }
    }
  }, [activeTab, currentDistrict?.slug]);

  // ── Server search: debounced query changes → reload from page 1 ───────────
  useEffect(() => {
    if (activeTab !== "place" || !currentDistrict?.slug) return;
    const key = `${currentDistrict.slug}::${debouncedSearch}`;
    placesKeyRef.current = key;
    setPlaces([]);
    loadPlaces({
      districtSlug: currentDistrict.slug,
      page: 1,
      q: debouncedSearch,
      replace: true,
    });
  }, [debouncedSearch, currentDistrict?.slug]);

  // ── IntersectionObserver: sentinel at bottom of place list → load more ──────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        const { page, totalPages, loading, loadingMore } = loadMoreStateRef.current;
        if (loading || loadingMore || page >= totalPages || !currentDistrict?.slug) return;
        loadPlaces({
          districtSlug: currentDistrict.slug,
          page: page + 1,
          q: debouncedSearch,
          replace: false,
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // loadVersion intentionally included: reconnects IO after each fetch so it re-fires
    // with the correct totalPages stored in loadMoreStateRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDistrict?.slug, debouncedSearch, loadPlaces, loadVersion]);

  // ── Districts (merged payload + client) ───────────────────────────────────
  const districts = clientDistricts ?? payloadFilters.districts ?? [];

  // ── Client-side search for city / district tabs ───────────────────────────
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(value), 250);
  };

  const clearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
  };

  const filteredCities = useMemo(() => {
    if (!debouncedSearch.trim()) return cities;
    const q = debouncedSearch;
    return cities.filter((p) =>
      regionSearchMatches(q, [p.nameVi, p.nameEn, p.nameKo, p.slug, p.slug.replace(/-/g, " ")]),
    );
  }, [debouncedSearch, cities]);

  const filteredDistricts = useMemo(() => {
    if (!debouncedSearch.trim()) return districts;
    const q = debouncedSearch;
    return districts.filter((d) =>
      regionSearchMatches(q, [d.nameVi, d.nameEn, d.nameKo, d.slug, d.slug.replace(/-/g, " ")]),
    );
  }, [debouncedSearch, districts]);

  // ── Navigation handlers ───────────────────────────────────────────────────
  const handleSelectCity = (city?: CityResponseDto) => {
    if (city) {
      selectCity(city, "manual");
    } else {
      selectCity(null, "manual");
    }
    clearSearch();
    onClose();
  };

  const handleSelectDistrict = () => {
    clearSearch();
    onClose();
  };

  const handleSelectPlace = () => {
    clearSearch();
    onClose();
  };



  // ── Tab change ────────────────────────────────────────────────────────────
  const handleTabChange = async (tab: Tab) => {
    if (tab === "district" && !currentCity) return;
    if (tab === "place" && !currentDistrict) return;

    setActiveTab(tab);
    setSearch("");
    setDebouncedSearch("");

    if (tab === "district" && currentCity && !clientDistricts && !payloadFilters.districts?.length) {
      setLoadingDistricts(true);
      try {
        setClientDistricts(await fetchDistrictsByCitySlug(currentCity.slug));
      } catch {
        setClientDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    }

    if (tab === "place" && currentDistrict) {
      // Always reset + reload on tab switch to ensure fresh data
      const key = `${currentDistrict.slug}::`;
      if (placesKeyRef.current !== key) {
        placesKeyRef.current = key;
        setPlaces([]);
        loadPlaces({ districtSlug: currentDistrict.slug, page: 1, q: "", replace: true });
      }
    }
  };

  const allActive =
    (activeTab === "province" && !currentCity) ||
    (activeTab === "district" && !currentDistrict) ||
    (activeTab === "place" && !payloadFilters.currentPlace);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Drawer open={open} onClose={onClose} title={t("region")}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e9eaeb", flexShrink: 0 }}>
        {(["province", "district", "place"] as Tab[]).map((tab) => {
          const disabled = (tab === "district" && !currentCity) || (tab === "place" && !currentDistrict);
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              disabled={disabled}
              style={{
                flex: 1,
                padding: "12px 0",
                border: "none",
                background: "transparent",
                cursor: disabled ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: isActive ? 500 : 400,
                color: isActive ? "#143423" : disabled ? "#c1c5cc" : "#717680",
                borderBottom: isActive ? "2px solid #143423" : "2px solid transparent",
                transition: "color 200ms, border-color 200ms",
              }}
            >
              {t(tab === "province" ? "province" : tab === "district" ? "district" : "place")}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ padding: "12px 16px", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "1px solid #e9eaeb",
            borderRadius: "16px",
            padding: "8px 12px",
          }}
        >
          <Search size={16} color="#a4a7ae" />
          <input
            type="search"
            placeholder={t("search_region")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "#0a0d12",
              background: "transparent",
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        <div style={{ padding: "0 16px" }}>
          {/* "All" row */}
          <Link
            href={getHref(
              buildSeoUrl(
                locale,
                currentService?.slugGlobal || null,
                activeTab === "province" ? null : currentCity?.slug ?? null,
                activeTab === "province" || activeTab === "district" ? null : currentDistrict?.slug ?? null,
              )
            )}
            scroll={false}
            replace={true}
            onClick={() => {
              if (activeTab === "province") {
                // If "All" is clicked for province, we don't have a specific city to select
                handleSelectCity();
              } else if (activeTab === "district") {
                handleSelectDistrict();
              } else {
                handleSelectPlace();
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              textAlign: "left",
              padding: "12px 16px",
              borderBottom: "1px solid #e9eaeb",
              background: allActive ? "#E6EBE4" : "transparent",
              cursor: "pointer",
              fontSize: "14px",
              color: "#0a0d12",
              marginTop: "8px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            <span>{t("all")}</span>
            {allActive && <Check size={16} color="#143423" />}
          </Link>
        </div>

        {/* Province tab */}
        {activeTab === "province" &&
          (filteredCities.length === 0 ? (
            <p style={{ padding: "24px 16px", textAlign: "center", color: "#717680", fontSize: "14px" }}>
              {t("no_results")}
            </p>
          ) : (
            filteredCities.map((city) => {
              const isActive = currentCity?.slug === city.slug;
              return (
                <Link
                  key={city.slug}
                  href={getHref(buildSeoUrl(locale, currentService?.slugGlobal || null, city.slug, null))}
                  scroll={false}
                  replace={true}
                  onClick={() => handleSelectCity(city)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 16px",
                    borderBottom: "1px solid #e9eaeb",
                    background: isActive ? "#E6EBE4" : "transparent",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: isActive ? "#143423" : "#0a0d12",
                    fontWeight: isActive ? 500 : 400,
                    textDecoration: "none",
                  }}
                >
                  <span>{cityDisplayName(city, locale)}</span>
                  {isActive && <Check size={16} color="#143423" />}
                </Link>
              );
            })
          ))}

        {/* District tab */}
        {activeTab === "district" &&
          (loadingDistricts ? (
            <p style={{ padding: "24px 16px", textAlign: "center", color: "#717680", fontSize: "14px" }}>...</p>
          ) : filteredDistricts.length === 0 ? (
            <p style={{ padding: "24px 16px", textAlign: "center", color: "#717680", fontSize: "14px" }}>
              {t("no_results")}
            </p>
          ) : (
            filteredDistricts.map((district) => {
              const isActive = currentDistrict?.slug === district.slug;
              return (
                <Link
                  key={district.slug}
                  href={getHref(buildSeoUrl(locale, currentService?.slugGlobal || null, currentCity?.slug ?? null, district.slug))}
                  scroll={false}
                  replace={true}
                  onClick={() => handleSelectDistrict()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 16px",
                    borderBottom: "1px solid #e9eaeb",
                    background: isActive ? "#E6EBE4" : "transparent",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: isActive ? "#143423" : "#0a0d12",
                    fontWeight: isActive ? 500 : 400,
                    textDecoration: "none",
                  }}
                >
                  <span>{districtDisplayName(district, locale)}</span>
                  {isActive && <Check size={16} color="#143423" />}
                </Link>
              );
            })
          ))}

        {/* Place tab */}
        {activeTab === "place" &&
          (loadingPlaces ? (
            // skeleton rows
            <div style={{ padding: "0 16px" }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: "44px",
                    borderBottom: "1px solid #e9eaeb",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      height: "14px",
                      width: `${55 + (i % 4) * 10}%`,
                      borderRadius: "6px",
                      background: "#e9eaeb",
                      animation: "pulse 1.4s ease-in-out infinite",
                    }}
                  />
                </div>
              ))}
            </div>
          ) : places.length === 0 ? (
            <p style={{ padding: "24px 16px", textAlign: "center", color: "#717680", fontSize: "14px" }}>
              {t("no_results")}
            </p>
          ) : (
            <>
              {/* Pin the selected place at top if not yet loaded in paginated results */}
              {(() => {
                const pinned = payloadFilters.currentPlace;
                if (!pinned || places.some((p) => p.slug === pinned.slug)) return null;
                return (
                  <Link
                    key={`pinned-${pinned.id}`}
                    href={getHref(
                      buildSeoUrl(
                        locale,
                        currentService?.slugGlobal || null,
                        currentCity?.slug ?? null,
                        currentDistrict?.slug ?? null,
                        pinned.slug,
                      )
                    )}
                    scroll={false}
                    replace={true}
                    onClick={() => handleSelectPlace()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 16px",
                      borderBottom: "1px solid #e9eaeb",
                      background: "#E6EBE4",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#143423",
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                  >
                    <span>{placeDisplayName(pinned, locale)}</span>
                    <Check size={16} color="#143423" />
                  </Link>
                );
              })()}

              {places.map((place) => {
                const isActive = payloadFilters.currentPlace?.slug === place.slug;
                return (
                  <Link
                    key={place.id}
                    href={getHref(
                      buildSeoUrl(
                        locale,
                        currentService?.slugGlobal || null,
                        currentCity?.slug ?? null,
                        currentDistrict?.slug ?? null,
                        place.slug,
                      )
                    )}
                    scroll={false}
                    replace={true}
                    onClick={() => handleSelectPlace()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 16px",
                      borderBottom: "1px solid #e9eaeb",
                      background: isActive ? "#E6EBE4" : "transparent",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: isActive ? "#143423" : "#0a0d12",
                      fontWeight: isActive ? 500 : 400,
                      textDecoration: "none",
                    }}
                  >
                    <span>{placeDisplayName(place, locale)}</span>
                    {isActive && <Check size={16} color="#143423" />}
                  </Link>
                );
              })}

              {/* Sentinel: IntersectionObserver fires here to trigger load-more */}
              <div ref={sentinelRef} style={{ height: 1 }} />

              {/* Load more indicator */}
              {loadingMorePlaces && (
                <p style={{ padding: "12px 16px", textAlign: "center", color: "#717680", fontSize: "13px" }}>
                  {t("loading_more") ?? "Đang tải..."}
                </p>
              )}

              {/* Total count hint */}
              {!loadingMorePlaces && placesPage >= placesTotalPages && placesTotal > 0 && (
                <p style={{ padding: "12px 16px", textAlign: "center", color: "#a4a7ae", fontSize: "12px" }}>
                  {placesTotal} {t("places_total") ?? "địa điểm"}
                </p>
              )}
            </>
          ))}
      </div>
    </Drawer>
  );
}
