"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Search, X, Clock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Input, InputGroup } from "@/components/ui/input";
import http from "@/services/http";
import type { LocaleTypes } from "@/i18n/settings";
import { useTranslation } from "@/i18n/client";

// Component: SearchBox trong header
// Mục đích: gọi API gợi ý tìm kiếm khi user gõ, hiển thị dropdown gợi ý,
// và cho phép click để điều hướng tới trang tương ứng.
// Luồng chính:
// - Các `useState` giữ query, suggestions, trạng thái loading/focus
// - `useEffect` sẽ debounce và gọi API khi query >= 2 ký tự
// - Kết quả từ backend được chuẩn hoá thành mảng `SuggestionItem` có dạng
//   string | { label: string, href?: string }
// - Khi click suggestion, nếu có `href` sẽ chuyển trang, còn không chỉ đặt lại query

type SuggestionItem =
  | string
  | { label: string; href?: string; category?: string };

export default function HeaderSearchBox({ autoFocus = false }: { autoFocus?: boolean } = {}) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as LocaleTypes) || "vi";
  const { t } = useTranslation(locale, "main-menu");

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('search_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) { }
  }, []);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const encoded = encodeURIComponent(query.trim());
        const { data } = await http.get<{
          suggestions?: SuggestionItem[];
          data?: SuggestionItem[] | Record<string, any>;
          items?: SuggestionItem[];
          results?: SuggestionItem[];
          service?: SuggestionItem[];
          spa?: SuggestionItem[];
          [key: string]: any;
        }>(
          `/api/v1/search/suggest?keyword=${encoded}&lang=${locale}`,
          { signal: controller.signal },
        );

        if (controller.signal.aborted) {
          return;
        }

        const collectCategoryArrays = (obj: Record<string, unknown>): SuggestionItem[] => {
          const result: SuggestionItem[] = [];
          for (const [key, value] of Object.entries(obj)) {
            if (Array.isArray(value)) {
              const mapped = value.map(item => {
                if (item && typeof item === 'object') {
                  return { ...item, category: (item as any).category || key };
                }
                return item;
              });
              result.push(...mapped);
            } else if (value && typeof value === 'object') {
              result.push(...collectCategoryArrays(value as Record<string, unknown>));
            }
          }
          return result;
        };

        const suggestionsFromResponse: SuggestionItem[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.suggestions)
            ? data.suggestions
            : Array.isArray(data?.items)
              ? data.items
              : Array.isArray(data?.results)
                ? data.results
                : Array.isArray(data?.data)
                  ? data.data
                  : (data && typeof data === 'object')
                    ? collectCategoryArrays(data as Record<string, unknown>)
                    : [];

        if (suggestionsFromResponse.length === 0 && data && typeof data === 'object') {
          console.debug('Header search suggestion payload', data);
        }

        const normalizedRaw = suggestionsFromResponse
          .map((it) => {
            if (!it) return null;
            if (typeof it === "string") {
              const s = it.trim();
              if (!s) return null;
              const lower = s.toLowerCase();
              if (lower === 'null' || lower === 'undefined') return null;
              return s;
            }

            const rawLabel = (it as any).name || (it as any).nameVi || (it as any).nameEn || (it as any).nameKo || (it as any).title || (it as any).titleVi || (it as any).titleEn || (it as any).titleKo || (it as any).shopName || (it as any).label || '';
            let label = typeof rawLabel === 'string' ? rawLabel.trim() : '';
            if (label) {
              const ll = label.toLowerCase();
              if (ll === 'null' || ll === 'undefined') label = '';
            }

            let href: any = (it as any).url || (it as any).href || (it as any).path || undefined;
            const category = (it as any).category || (it as any).type || (it as any).kind || (it as any).__source || undefined;
            if (typeof href === 'number') href = String(href);
            if (typeof href === 'string') {
              href = href.trim();
              const lower = href.toLowerCase();
              if (!href || lower === 'null' || lower === 'undefined') {
                href = undefined;
              } else {
                const isAbsolute = href.startsWith('/') || /^https?:\/\//i.test(href) || href.startsWith('#') || href.startsWith('mailto:');
                if (!isAbsolute) {
                  href = `/${href}`;
                }

                if (category === 'spa' && !href.startsWith('/provider/') && !/^https?:\/\//i.test(href)) {
                  href = `/provider${href.startsWith('/') ? '' : '/'}${href}`;
                } else if (category === 'deal' && !href.startsWith('/organization_services/') && !/^https?:\/\//i.test(href)) {
                  href = `/organization_services${href.startsWith('/') ? '' : '/'}${href}`;
                }
              }
            }

            if (label) {
              return { label, href, category };
            }

            return null;
          })
          .filter(Boolean) as SuggestionItem[];

        const seen = new Set<string>();
        const normalized = normalizedRaw.filter((s) => {
          const key = typeof s === 'string' ? `${s}||` : `${s.label}||${(s.href || '')}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setSuggestions(normalized);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Header search suggestion error", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controllerRef.current?.abort();
    };
  }, [query, locale]);

  const handleSuggestionClick = (item: SuggestionItem) => {
    const label = typeof item === "string" ? item : item.label;
    try {
      const newHistory = [label, ...history.filter(h => h !== label)].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('search_history', JSON.stringify(newHistory));
    } catch (e) { }

    let href = typeof item === "string" ? undefined : item.href;
    if (href) {
      const locale = params?.locale as string;
      if (locale && href.startsWith("/") && !href.startsWith(`/${locale}/`) && href !== `/${locale}`) {
        href = `/${locale}${href}`;
      }
      setQuery('');
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      router.push(href);
      return;
    }
    setQuery(label);
  };

  const renderLabel = (label: string) => {
    if (!query) return label;
    const lower = label.toLowerCase();
    const q = query.trim().toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return label;
    return (
      <>
        {label.slice(0, idx)}
        <mark className="bg-yellow-100 text-slate-800">{label.slice(idx, idx + q.length)}</mark>
        {label.slice(idx + q.length)}
      </>
    );
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;

    // Ưu tiên tìm các gợi ý là danh mục (service) hoặc khu vực (location/city) thay vì spa cụ thể
    const categorySuggestion = suggestions.find(
      (s) => typeof s === "object" && s.href && s.category && !['spa', 'deal'].includes(s.category.toLowerCase())
    );

    // Nếu không có, fallback về gợi ý có link đầu tiên
    const targetNavigable = categorySuggestion || suggestions.find((s) => typeof s === "object" && s.href);
    
    if (targetNavigable) {
      handleSuggestionClick(targetNavigable);
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleFormSubmit}>
        <InputGroup className="flex items-center h-11 overflow-hidden rounded-xl bg-white shadow-sm border-none transition-all">
          <div className="flex h-full items-center justify-center pl-4 pr-3">
            <Search className="h-[18px] w-[18px] text-[#5B6B58]" />
          </div>
          <Input
            variant="lg"
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => window.setTimeout(() => setIsFocused(false), 200)}
            aria-label={t("search.placeholder")}
            className="h-full rounded-xl border-none bg-transparent pl-2 pr-0 text-[14px] text-slate-900 placeholder:text-slate-500 focus-visible:ring-0"
            autoFocus={autoFocus}
            suppressHydrationWarning
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="my-auto flex h-5 w-5 flex-none items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 mr-4 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </InputGroup>
      </form>

      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 z-50 mt-2 rounded-2xl border border-slate-200 bg-white shadow-[0px_8px_32px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2 text-xs uppercase tracking-[0.1em] font-bold text-primary">
              <span>{t("search.suggestions")}</span>
              {isLoading ? <span>{t("search.loading")}</span> : null}
            </div>

            <div className="max-h-[360px] overflow-auto pb-2">
              {suggestions.length > 0 ? (
                <ul className="flex flex-col px-2">
                  {suggestions.slice(0, 6).map((item, index) => {
                    const label = typeof item === "string" ? item : item.label;
                    const isHistory = history.includes(label);
                    return (
                      <li key={`${label}-${index}`}>
                        <button
                          type="button"
                          onClick={() => handleSuggestionClick(item)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] transition hover:bg-primary/5 ${isHistory ? "text-slate-800" : "text-slate-600"}`}
                        >
                          {isHistory ? (
                            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                          ) : (
                            <Search className="h-4 w-4 shrink-0 text-slate-400" />
                          )}
                          <span className="flex-1">{renderLabel(label)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : !isLoading && query.trim().length >= 2 ? (
                <div className="px-4 py-4 text-sm text-slate-500">
                  {t("search.no_results")}
                </div>
              ) : (
                <div className="px-4 py-4 text-sm text-slate-500">
                  {query.trim().length < 2 ? t("search.min_chars") : t("search.no_results")}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
