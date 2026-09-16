'use client';

import type { ComponentType } from 'react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Clock3,
  FolderKanban,
  Gauge,
  LayoutTemplate,
  LoaderCircle,
  MapPinned,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { showNotify } from '@/stores/notify/notify.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ADMIN_API_BASE, ADMIN_PROXY_BASE } from './admin-auth';
import type { BannerLocale, BannerResponseDto } from '@/types/api';

type BannerLocaleFormState = {
  name: string;
  imageFile: File | null;
};

type BannerFormState = {
  slotNumber: string;
  targetUrl: string;
  gaClickTag: string;
  isEnabled: boolean;
  displayOrder: string;
  spaId: string | null;
  locales: Record<BannerLocale, BannerLocaleFormState>;
};

type FilterMode = 'all' | 'enabled' | 'incomplete' | 'missing';
type EditorMode = 'auto' | 'creating' | 'editing';

type NavItem = {
  label: string;
  group: string;
  active?: boolean;
  disabled?: boolean;
  icon: ComponentType<{ className?: string }>;
};

type LocaleMeta = {
  code: BannerLocale;
  shortLabel: string;
  label: string;
  helper: string;
};

const localeMetas: LocaleMeta[] = [
  { code: 'vi', shortLabel: 'VI', label: 'Vietnamese', helper: 'Base locale. Name + image are required.' },
  { code: 'en', shortLabel: 'EN', label: 'English', helper: 'Optional. Falls back to VI when left blank.' },
  { code: 'ko', shortLabel: 'KO', label: 'Korean', helper: 'Optional. Falls back to VI when left blank.' },
];

const emptyForm: BannerFormState = {
  slotNumber: '1',
  targetUrl: '',
  gaClickTag: '',
  isEnabled: true,
  displayOrder: '0',
  spaId: null,
  locales: {
    vi: { name: '', imageFile: null },
    en: { name: '', imageFile: null },
    ko: { name: '', imageFile: null },
  },
};

const navItems: NavItem[] = [
  { label: 'Dashboard', group: 'Overview', icon: Gauge, disabled: true },
  { label: 'Banners', group: 'Content', icon: LayoutTemplate, active: true },
  { label: 'Deals', group: 'Content', icon: FolderKanban, disabled: true },
  { label: 'Spas', group: 'Supply', icon: Sparkles, disabled: true },
  { label: 'Places', group: 'Geography', icon: MapPinned, disabled: true },
  { label: 'Tracking & SEO', group: 'Visibility', icon: Search, disabled: true },
  { label: 'Settings', group: 'System', icon: Settings2, disabled: true },
];

function normalizeResponse<T>(payload: T | { data: T }): T {
  return (payload as { data?: T }).data ?? (payload as T);
}

function resolveImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  return `${ADMIN_API_BASE}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
}

function sortBanners(items: BannerResponseDto[]): BannerResponseDto[] {
  return [...items].sort((left, right) => {
    const leftSlot = left.slotNumber ?? 999;
    const rightSlot = right.slotNumber ?? 999;

    if (leftSlot !== rightSlot) return leftSlot - rightSlot;
    if (left.displayOrder !== right.displayOrder) return left.displayOrder - right.displayOrder;
    return left.id - right.id;
  });
}

function getBannerLocaleName(banner: BannerResponseDto, locale: BannerLocale): string {
  if (locale === 'en') return banner.nameEn?.trim() || '';
  if (locale === 'ko') return banner.nameKo?.trim() || '';
  return banner.nameVi?.trim() || banner.name.trim();
}

function getBannerLocaleImage(banner: BannerResponseDto, locale: BannerLocale): string | null {
  if (locale === 'en') return resolveImageUrl(banner.imageUrlEn);
  if (locale === 'ko') return resolveImageUrl(banner.imageUrlKo);
  return resolveImageUrl(banner.imageUrlVi ?? banner.imageUrl);
}

function hasBannerLocaleConfigured(banner: BannerResponseDto, locale: BannerLocale): boolean {
  return Boolean(getBannerLocaleName(banner, locale) && getBannerLocaleImage(banner, locale));
}

function countConfiguredLocales(banner: BannerResponseDto): number {
  return localeMetas.filter(({ code }) => hasBannerLocaleConfigured(banner, code)).length;
}

function getLocaleBadgeTone(isReady: boolean) {
  return isReady
    ? 'border-[#cfe3d7] bg-[#eef8f0] text-[#285b46]'
    : 'border-[#eadbc5] bg-[#fff7ea] text-[#9a5b1a]';
}

function extractApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;

  const candidate = payload as {
    error?: { message?: string };
    message?: string;
  };

  return candidate.error?.message ?? candidate.message ?? null;
}

function getFormIssues(form: BannerFormState): string[] {
  const issues: string[] = [];
  const slotNumber = Number(form.slotNumber);
  const displayOrder = Number(form.displayOrder);

  if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > 8) {
    issues.push('Slot number must be between 1 and 8.');
  }

  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    issues.push('Display order must be zero or greater.');
  }

  if (!form.targetUrl.trim()) {
    issues.push('Target URL is required.');
  }

  if (!form.locales.vi.name.trim()) {
    issues.push('Vietnamese banner name is required.');
  }

  return issues;
}

function BannerImagePreview({
  file,
  imageUrl,
  alt,
  emptyLabel,
}: {
  file: File | null;
  imageUrl: string | null;
  alt: string;
  emptyLabel: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    setPreviewUrl(imageUrl);
    return undefined;
  }, [file, imageUrl]);

  return (
    <div className="aspect-square overflow-hidden rounded-[20px] border border-[#ece5d8] bg-[#eef3ee]">
      {previewUrl ? (
        <img src={previewUrl} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center px-5 text-center text-sm leading-6 text-[#7b8378]">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

function SpaSearchAutocomplete({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSpaName, setSelectedSpaName] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value === null) {
      setSelectedSpaName(null);
      setQuery('');
      return;
    }
    // Try to fetch the selected spa's name if we only have the ID and no name yet.
    if (!selectedSpaName && value) {
      fetch(`${ADMIN_PROXY_BASE}/spas/${value}`)
        .then(res => res.json())
        .then(data => {
          if (data?.data) {
            setSelectedSpaName(data.data.name);
          }
        })
        .catch(() => {});
    }
  }, [value, selectedSpaName]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`${ADMIN_PROXY_BASE}/spas?q=${encodeURIComponent(query)}&limit=5`)
        .then(res => res.json())
        .then(data => setResults(data?.data || []))
        .catch(() => setResults([]))
        .finally(() => setIsSearching(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      {value ? (
        <div className="flex items-center justify-between rounded-md border border-[#ece5d8] bg-[#f9f9f9] px-3 py-2 text-sm">
          <span className="truncate font-medium text-[#285b46]">{selectedSpaName || `Spa ID: ${value}`}</span>
          <button
            type="button"
            className="ml-2 text-[#9a5b1a] hover:text-[#7f4a13]"
            onClick={() => {
              onChange(null);
              setSelectedSpaName(null);
              setQuery('');
            }}
            disabled={disabled}
          >
            Clear
          </button>
        </div>
      ) : (
        <div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Tìm kiếm Spa theo tên / ID..."
            disabled={disabled}
          />
          {isFocused && query.trim() && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-md border border-[#ece5d8] bg-white shadow-lg">
              {isSearching ? (
                <div className="px-4 py-2 text-sm text-gray-500">Đang tìm kiếm...</div>
              ) : results.length > 0 ? (
                results.map(spa => (
                  <button
                    key={spa.id}
                    type="button"
                    className="w-full border-b border-[#f1ebdf] px-4 py-2 text-left text-sm hover:bg-[#eef4ef] last:border-b-0"
                    onClick={() => {
                      onChange(spa.id);
                      setSelectedSpaName(spa.name);
                      setQuery('');
                    }}
                  >
                    <div className="font-medium">{spa.name}</div>
                    <div className="text-xs text-gray-500">{spa.slug} - ID: {spa.id}</div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500">Không tìm thấy Spa nào.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminBannerPage({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [banners, setBanners] = useState<BannerResponseDto[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<BannerFormState>(emptyForm);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [activeLocale, setActiveLocale] = useState<BannerLocale>('vi');
  const [isPending, startTransition] = useTransition();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [editorMode, setEditorMode] = useState<EditorMode>('auto');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  async function loadBanners(options?: { silentSuccess?: boolean }) {
    setError('');
    const response = await fetch(`${ADMIN_PROXY_BASE}/banners`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(extractApiErrorMessage(payload) ?? `Load banners failed: ${response.status}`);
    }

    const payload = normalizeResponse<BannerResponseDto[]>(await response.json());
    setBanners(sortBanners(payload));

    if (!options?.silentSuccess) {
      showNotify({
        severity: 'success',
        title: 'Refreshed',
        content: 'Banner inventory has been updated.',
      });
    }
  }

  useEffect(() => {
    startTransition(() => {
      loadBanners({ silentSuccess: true }).catch((loadError) => {
        const message = loadError instanceof Error ? loadError.message : 'Cannot load banners';
        setError(message);
        showNotify({
          severity: 'error',
          title: 'Load failed',
          content: message,
        });
      });
    });
  }, []);

  const sortedBanners = sortBanners(banners).filter((banner) => banner.placement === 'home_slot');
  const homeBanners = sortedBanners;
  const selectedBanner = sortedBanners.find((banner) => banner.id === selectedId) ?? null;
  const emptyHomeSlots = Array.from({ length: 8 }, (_, index) => index + 1).filter(
    (slot) => !homeBanners.some((banner) => banner.slotNumber === slot),
  );

  useEffect(() => {
    if (editorMode !== 'auto') return;
    if (selectedBanner) return;

    if (homeBanners[0]) {
      resetForm(homeBanners[0]);
    }
  }, [selectedBanner, homeBanners, editorMode]);

  function resetForm(nextBanner?: BannerResponseDto | null) {
    setActiveLocale('vi');

    if (!nextBanner) {
      const firstMissingSlot = Array.from({ length: 8 }, (_, index) => index + 1).find(
        (slot) => !homeBanners.some((banner) => banner.slotNumber === slot),
      );

      setSelectedId(null);
      setEditorMode('creating');
      setForm({
        ...emptyForm,
        slotNumber: String(firstMissingSlot ?? 1),
      });
      return;
    }

    setSelectedId(nextBanner.id);
    setEditorMode('editing');
    setForm({
      slotNumber: nextBanner.slotNumber ? String(nextBanner.slotNumber) : '',
      targetUrl: nextBanner.targetUrl,
      gaClickTag: nextBanner.gaClickTag ?? '',
      isEnabled: nextBanner.isEnabled,
      displayOrder: String(nextBanner.displayOrder),
      spaId: nextBanner.spaId ?? null,
      locales: {
        vi: { name: nextBanner.nameVi ?? nextBanner.name, imageFile: null },
        en: { name: nextBanner.nameEn ?? '', imageFile: null },
        ko: { name: nextBanner.nameKo ?? '', imageFile: null },
      },
    });
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');
    setError('');

    const formData = new FormData();
    formData.set('name', form.locales.vi.name);
    formData.set('nameVi', form.locales.vi.name);
    if (form.locales.en.name.trim()) formData.set('nameEn', form.locales.en.name.trim());
    if (form.locales.ko.name.trim()) formData.set('nameKo', form.locales.ko.name.trim());
    formData.set('placement', 'home_slot');
    formData.set('slotNumber', form.slotNumber);
    formData.set('targetUrl', form.targetUrl);
    formData.set('gaClickTag', form.gaClickTag);
    formData.set('isEnabled', String(form.isEnabled));
    formData.set('displayOrder', form.displayOrder || '0');
    if (form.spaId != null) formData.set('spaId', String(form.spaId));
    if (form.locales.vi.imageFile) formData.set('imageVi', form.locales.vi.imageFile);
    if (form.locales.en.imageFile) formData.set('imageEn', form.locales.en.imageFile);
    if (form.locales.ko.imageFile) formData.set('imageKo', form.locales.ko.imageFile);

    const isEditing = selectedId != null;
    const url = isEditing
      ? `${ADMIN_PROXY_BASE}/banners/${selectedId}`
      : `${ADMIN_PROXY_BASE}/banners`;
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      body: formData,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(extractApiErrorMessage(payload) ?? `Save banner failed: ${response.status}`);
    }

    const saved = normalizeResponse<BannerResponseDto>(await response.json());
    await loadBanners({ silentSuccess: true });
    resetForm(saved);
    setStatus(isEditing ? 'Banner updated.' : 'Banner created.');
  }

  async function deleteBanner(id: number) {
    setStatus('');
    setError('');

    const response = await fetch(`${ADMIN_PROXY_BASE}/banners/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(extractApiErrorMessage(payload) ?? `Delete banner failed: ${response.status}`);
    }

    await loadBanners({ silentSuccess: true });
    resetForm(null);
    setStatus('Banner deleted.');
  }

  async function saveOrder() {
    setStatus('');
    setError('');

    const items = sortedBanners.map((banner) => ({
      id: banner.id,
      displayOrder: banner.displayOrder,
    }));

    const response = await fetch(`${ADMIN_PROXY_BASE}/banners/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(extractApiErrorMessage(payload) ?? `Save order failed: ${response.status}`);
    }

    await loadBanners({ silentSuccess: true });
    setStatus('Display order saved.');
  }

  function updateBannerOrder(id: number, nextValue: string) {
    setBanners((current) => current.map((banner) =>
      banner.id === id
        ? {
            ...banner,
            displayOrder: Number.isFinite(Number(nextValue)) ? Number(nextValue) : banner.displayOrder,
          }
        : banner));
  }

  function updateLocaleField(locale: BannerLocale, patch: Partial<BannerLocaleFormState>) {
    setForm((current) => ({
      ...current,
      locales: {
        ...current.locales,
        [locale]: {
          ...current.locales[locale],
          ...patch,
        },
      },
    }));
  }

  function handleSlotCardClick(slotNumber: number) {
    const banner = homeBanners.find((item) => item.slotNumber === slotNumber) ?? null;
    if (banner) {
      resetForm(banner);
      return;
    }

    setSelectedId(null);
    setEditorMode('creating');
    setActiveLocale('vi');
    setForm({
      ...emptyForm,
      slotNumber: String(slotNumber),
    });
  }

  const filteredCurrentPlacementBanners = sortedBanners.filter((banner) => {
    if (filterMode === 'enabled') return banner.isEnabled;
    if (filterMode === 'incomplete') return countConfiguredLocales(banner) < localeMetas.length;
    return filterMode !== 'missing';
  });

  const slotCoverageCards = Array.from({ length: 8 }, (_, index) => {
    const slotNumber = index + 1;
    const banner = homeBanners.find((item) => item.slotNumber === slotNumber) ?? null;
    return { slotNumber, banner };
  });

  const fullyLocalizedCount = homeBanners.filter((banner) => countConfiguredLocales(banner) === localeMetas.length).length;

  const inventoryStats = [
    {
      label: 'Slot coverage',
      value: `${homeBanners.length}/8`,
      helper: emptyHomeSlots.length ? `${emptyHomeSlots.length} slot missing` : 'All slots filled',
    },
    {
      label: 'Fully localized',
      value: `${fullyLocalizedCount}/${homeBanners.length || 0}`,
      helper: 'Banners with VI, EN, KO name + image configured',
    },
    {
      label: 'Enabled banners',
      value: String(sortedBanners.filter((banner) => banner.isEnabled).length),
      helper: 'Currently visible on public site',
    },
  ];

  const activeLocaleMeta = localeMetas.find((item) => item.code === activeLocale) ?? localeMetas[0]!;
  const activeLocalePersistedImage = selectedBanner ? getBannerLocaleImage(selectedBanner, activeLocale) : null;
  const formIssues = useMemo(() => getFormIssues(form), [form]);
  const localeReadiness = useMemo(() => localeMetas.map((item) => {
    const localeName = form.locales[item.code].name.trim();
    const persistedImage = selectedBanner ? getBannerLocaleImage(selectedBanner, item.code) : null;
    const draftImage = form.locales[item.code].imageFile;
    return {
      ...item,
      isReady: Boolean(localeName && (draftImage || persistedImage)),
    };
  }), [form.locales, selectedBanner]);
  const readyLocaleCount = localeReadiness.filter((item) => item.isReady).length;
  const isBusy = isPending || isRefreshing || isSubmitting || isDeleting || isSavingOrder;

  async function handleRefresh() {
    setIsRefreshing(true);
    setStatus('');
    setError('');

    try {
      await loadBanners();
      setStatus('Banner inventory refreshed.');
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Cannot load banners';
      setError(message);
      showNotify({
        severity: 'error',
        title: 'Refresh failed',
        content: message,
      });
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className={embedded ? 'space-y-5 text-[#18261d]' : 'min-h-screen bg-[linear-gradient(180deg,#f4f1e8_0%,#fbfaf6_48%,#f4f8f4_100%)] text-[#18261d]'}>
      <div className={embedded ? 'space-y-5' : 'mx-auto flex min-h-screen max-w-[1440px] gap-5 px-4 py-5 md:px-6 lg:px-8'}>
        {!embedded && (
          <aside className="hidden w-[264px] shrink-0 rounded-[28px] border border-[#e7e1d4] bg-white/92 p-4 shadow-[0_20px_60px_-44px_rgba(24,38,29,0.55)] xl:flex xl:flex-col">
          <div className="rounded-[22px] border border-[#ece5d8] bg-[#faf6ef] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b7453]">Deals CMS</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#18261d]">Operations Admin</h1>
          </div>

          <div className="mt-5 flex-1 space-y-5">
            {Array.from(new Set(navItems.map((item) => item.group))).map((group) => (
              <div key={group}>
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8b7453]">{group}</p>
                <div className="space-y-1.5">
                  {navItems.filter((item) => item.group === group).map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-sm ${
                          item.active
                            ? 'border-[#cfded3] bg-[#eef4ef] text-[#285b46]'
                            : item.disabled
                              ? 'border-transparent bg-transparent text-[#95a095]'
                              : 'border-transparent bg-white text-[#18261d]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <span className={item.active ? 'font-semibold' : 'font-medium'}>{item.label}</span>
                        </div>
                        {item.active ? <ChevronRight className="h-4 w-4" /> : item.disabled ? <Clock3 className="h-3.5 w-3.5" /> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          </aside>
        )}

        <div className={embedded ? 'space-y-5' : 'flex min-w-0 flex-1 flex-col gap-5'}>
          <header className="rounded-[28px] border border-[#e7e1d4] bg-white/92 p-5 shadow-[0_18px_50px_-42px_rgba(24,38,29,0.55)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8b7453]">
                  <span>Content</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span>Banners</span>
                </div>
                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#18261d]">Banner Operations</h2>
                <p className="text-sm text-[#667065]">
                  Shared slot config, with locale-specific name and image variants for VI, EN, KO.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleRefresh()}
                  disabled={isBusy}
                >
                  {isRefreshing ? <LoaderCircle className="animate-spin" /> : <RefreshCw className={isPending ? 'animate-spin' : ''} />}
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="bg-[#285b46] text-white hover:bg-[#214b3a]"
                  onClick={() => resetForm(null)}
                  disabled={isBusy}
                >
                  <Plus />
                  New banner
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {inventoryStats.map((item) => (
                <div key={item.label} className="rounded-[22px] border border-[#ece5d8] bg-[#fffdf8] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b7453]">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#18261d]">{item.value}</p>
                  <p className="mt-1 text-sm text-[#667065]">{item.helper}</p>
                </div>
              ))}
            </div>

            {(status || error) && (
              <div className={`mt-5 rounded-[20px] border px-4 py-3 text-sm ${error ? 'border-[#ebc3bd] bg-[#fff4f2] text-[#a83d32]' : 'border-[#cfe3d7] bg-[#f1fbf4] text-[#285b46]'}`}>
                {error || status}
              </div>
            )}

            {error && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[#ebc3bd] bg-[#fff8f6] px-4 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-full bg-[#ffe6e1] p-2 text-[#a83d32]">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#6f2f28]">There was a problem talking to the admin API.</p>
                    <p className="mt-1 text-sm text-[#965349]">{error}</p>
                  </div>
                </div>
                <Button variant="outline" size="md" onClick={() => handleRefresh()} disabled={isBusy}>
                  <RefreshCw />
                  Try again
                </Button>
              </div>
            )}
          </header>

          <div className="grid min-h-0 gap-5 2xl:grid-cols-[minmax(0,1.35fr)_460px]">
            <section className="min-w-0 rounded-[28px] border border-[#e7e1d4] bg-white/92 p-5 shadow-[0_18px_50px_-42px_rgba(24,38,29,0.55)]">
              <div className="flex flex-col gap-4 border-b border-[#efe8dc] pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b7453]">Module workspace</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#18261d]">Inventory + Coverage</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="md"
                    disabled={isBusy || !sortedBanners.length}
                    onClick={() => {
                      setIsSavingOrder(true);
                      saveOrder()
                        .then(() => {
                          setStatus('Display order saved.');
                          showNotify({
                            severity: 'success',
                            title: 'Order saved',
                            content: 'Homepage banner order has been updated.',
                          });
                        })
                        .catch((saveError) => {
                          const message = saveError instanceof Error ? saveError.message : 'Cannot save order';
                          setError(message);
                          showNotify({
                            severity: 'error',
                            title: 'Save failed',
                            content: message,
                          });
                        })
                        .finally(() => setIsSavingOrder(false));
                    }}
                  >
                    {isSavingOrder ? <LoaderCircle className="animate-spin" /> : <Save />}
                    {isSavingOrder ? 'Saving order...' : 'Save order'}
                  </Button>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <div className="rounded-[24px] border border-[#ece5d8] bg-[#fffdf8] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b7453]">Slot map</p>
                      <h4 className="mt-1 text-lg font-semibold text-[#18261d]">Fixed 8-slot coverage</h4>
                    </div>
                    <p className="text-sm text-[#667065]">
                      {emptyHomeSlots.length ? `Missing slots: ${emptyHomeSlots.join(', ')}` : 'All slots configured'}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {slotCoverageCards.map(({ slotNumber, banner }) => {
                      const isSelected = selectedBanner?.id === banner?.id;
                      const configuredLocaleCount = banner ? countConfiguredLocales(banner) : 0;
                      return (
                        <button
                          key={slotNumber}
                          type="button"
                          onClick={() => handleSlotCardClick(slotNumber)}
                          className={`overflow-hidden rounded-[22px] border text-left transition-all ${
                            isSelected
                              ? 'border-[#bfd5c6] bg-[#eef4ef] shadow-[0_18px_30px_-24px_rgba(40,91,70,0.75)]'
                              : 'border-[#ece5d8] bg-white hover:border-[#d8cdb9]'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-[#efe8dc] px-4 py-3">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7453]">Slot {slotNumber}</span>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                              banner?.isEnabled ? 'bg-[#e7f6ec] text-[#285b46]' : banner ? 'bg-[#fff1e4] text-[#9a5b1a]' : 'bg-[#f3f1eb] text-[#7f887a]'
                            }`}>
                              {banner ? (banner.isEnabled ? 'Enabled' : 'Disabled') : 'Empty'}
                            </span>
                          </div>
                          <div className="aspect-square overflow-hidden bg-[#eef3ee]">
                            {banner ? (
                              <img src={resolveImageUrl(banner.imageUrlVi ?? banner.imageUrl) ?? ''} alt={banner.nameVi ?? banner.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center px-5 text-center text-sm leading-6 text-[#7b8378]">
                                Chưa có banner cho slot này
                              </div>
                            )}
                          </div>
                          <div className="space-y-2 px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate font-medium text-[#18261d]">{banner?.nameVi ?? `Create banner for slot ${slotNumber}`}</p>
                              {banner && (
                                <span className="rounded-full bg-[#faf4e8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b7453]">
                                  {configuredLocaleCount}/3 locales
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs text-[#667065]">
                              {banner?.targetUrl ?? 'Click để mở state tạo mới cho slot này'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#ece5d8] bg-white">
                  <div className="flex flex-col gap-4 border-b border-[#efe8dc] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b7453]">Inventory list</p>
                      <h4 className="mt-1 text-lg font-semibold text-[#18261d]">Banner slots</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {([
                        ['all', 'All'],
                        ['enabled', 'Enabled'],
                        ['incomplete', 'Locale gaps'],
                        ['missing', 'Missing slot'],
                      ] as const).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                            filterMode === mode
                              ? 'border-[#cfded3] bg-[#eef4ef] text-[#285b46]'
                              : 'border-[#ece5d8] bg-white text-[#667065]'
                          }`}
                          onClick={() => setFilterMode(mode)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filterMode === 'missing' ? (
                    <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                      {emptyHomeSlots.length ? emptyHomeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleSlotCardClick(slot)}
                          className="rounded-[20px] border border-dashed border-[#d9ccb8] bg-[#fffdf8] px-4 py-5 text-left hover:border-[#baa27e]"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b7453]">Missing slot</p>
                          <p className="mt-2 text-lg font-semibold text-[#18261d]">Slot {slot}</p>
                          <p className="mt-1 text-sm text-[#667065]">Click để tạo banner mới cho vị trí này.</p>
                        </button>
                      )) : (
                        <div className="px-4 py-10 text-sm text-[#667065]">Không còn slot trống ở homepage.</div>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-[#f1ebdf]">
                      {filteredCurrentPlacementBanners.map((banner) => {
                        const isSelected = selectedBanner?.id === banner.id;
                        const localeReadyCount = countConfiguredLocales(banner);
                        return (
                          <button
                            key={banner.id}
                            type="button"
                            onClick={() => resetForm(banner)}
                            className={`grid w-full gap-4 px-4 py-4 text-left transition-colors md:grid-cols-[120px_minmax(0,1fr)_130px_110px_120px] ${
                              isSelected ? 'bg-[#eef4ef]' : 'bg-white hover:bg-[#fcfaf6]'
                            }`}
                          >
                            <div className="aspect-square overflow-hidden rounded-[18px] border border-[#ece5d8] bg-[#eef3ee]">
                              <img src={resolveImageUrl(banner.imageUrlVi ?? banner.imageUrl) ?? ''} alt={banner.nameVi ?? banner.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#18261d]">{banner.nameVi ?? banner.name}</p>
                              <p className="mt-1 truncate text-xs text-[#667065]">{banner.targetUrl}</p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {localeMetas.map((item) => {
                                  const ready = hasBannerLocaleConfigured(banner, item.code);
                                  return (
                                    <span
                                      key={item.code}
                                      className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getLocaleBadgeTone(ready)}`}
                                    >
                                      {item.shortLabel}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7453]">Locales</p>
                              <p className="mt-2 text-sm font-medium text-[#18261d]">{localeReadyCount}/3 ready</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7453]">Status</p>
                              <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${banner.isEnabled ? 'bg-[#e7f6ec] text-[#285b46]' : 'bg-[#fff1e4] text-[#9a5b1a]'}`}>
                                {banner.isEnabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7453]">Display order</p>
                              <Input
                                type="number"
                                value={String(banner.displayOrder)}
                                onChange={(event) => updateBannerOrder(banner.id, event.target.value)}
                                onClick={(event) => event.stopPropagation()}
                                disabled={isBusy}
                              />
                            </div>
                          </button>
                        );
                      })}

                      {!filteredCurrentPlacementBanners.length && (
                        <div className="px-4 py-12 text-center text-sm text-[#667065]">
                          {isPending ? 'Loading inventory...' : 'No banner records match this view.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="rounded-[28px] border border-[#e7e1d4] bg-[#fffdf8] p-5 shadow-[0_18px_50px_-42px_rgba(24,38,29,0.55)]">
              <div className="border-b border-[#efe8dc] pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b7453]">Editor pane</p>
                <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#18261d]">
                  {selectedBanner ? 'Edit selected banner' : 'Create new banner'}
                </h3>
              </div>

              <div className="mt-4 rounded-[22px] border border-[#ece5d8] bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7453]">Banner context</p>
                    <p className="mt-1 font-medium text-[#18261d]">Homepage slot banner</p>
                    <p className="mt-1 text-sm text-[#667065]">Shared URL/order + locale-specific name and image assets.</p>
                  </div>
                  <div className="rounded-full bg-[#eef4ef] px-3 py-1 text-xs font-medium text-[#285b46]">
                    {`Slot ${form.slotNumber || '-'}`}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[18px] border border-[#ece5d8] bg-[#fffdf8] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7453]">Mode</p>
                    <p className="mt-1 text-sm font-medium text-[#18261d]">{selectedBanner ? 'Editing existing banner' : 'Creating new banner'}</p>
                  </div>
                  <div className="rounded-[18px] border border-[#ece5d8] bg-[#fffdf8] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7453]">Locale readiness</p>
                    <p className="mt-1 text-sm font-medium text-[#18261d]">{readyLocaleCount}/3 locales ready</p>
                  </div>
                  <div className={`rounded-[18px] border px-4 py-3 ${formIssues.length ? 'border-[#f0d1cb] bg-[#fff7f5]' : 'border-[#cfe3d7] bg-[#f3fbf5]'}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7453]">Publish health</p>
                    <p className={`mt-1 text-sm font-medium ${formIssues.length ? 'text-[#9a4035]' : 'text-[#285b46]'}`}>
                      {formIssues.length ? `${formIssues.length} issue${formIssues.length > 1 ? 's' : ''} to fix` : 'Ready to save'}
                    </p>
                  </div>
                </div>
              </div>

              <form
                className="mt-5 space-y-5"
                onSubmit={(event) => {
                  startTransition(() => {
                    setIsSubmitting(true);
                    submitForm(event)
                      .then(() => {
                        setStatus(selectedBanner ? 'Banner updated.' : 'Banner created.');
                        showNotify({
                          severity: 'success',
                          title: selectedBanner ? 'Banner updated' : 'Banner created',
                          content: selectedBanner
                            ? 'The selected banner has been updated successfully.'
                            : 'A new homepage banner has been created successfully.',
                        });
                      })
                      .catch((submitError) => {
                        const message = submitError instanceof Error ? submitError.message : 'Cannot save banner';
                        setError(message);
                        showNotify({
                          severity: 'error',
                          title: 'Save failed',
                          content: message,
                        });
                      })
                      .finally(() => setIsSubmitting(false));
                  });
                }}
              >
                <div className="rounded-[24px] border border-[#ece5d8] bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7453]">Shared config</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-[#36453c]">Slot number</span>
                      <Input
                        type="number"
                        min={1}
                        max={8}
                        value={form.slotNumber}
                        onChange={(event) => setForm((current) => ({ ...current, slotNumber: event.target.value }))}
                        disabled={isBusy}
                      />
                    </label>

                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-[#36453c]">Display order</span>
                      <Input
                        type="number"
                        min={0}
                        value={form.displayOrder}
                        onChange={(event) => setForm((current) => ({ ...current, displayOrder: event.target.value }))}
                        disabled={isBusy}
                      />
                    </label>
                  </div>

                  <label className="mt-4 block space-y-2 text-sm">
                    <span className="font-medium text-[#36453c]">Target URL</span>
                    <Input
                      type="text"
                      value={form.targetUrl}
                      placeholder="https://example.com/deal hoặc /vi/provider/spa-name"
                      onChange={(event) => setForm((current) => ({ ...current, targetUrl: event.target.value }))}
                      required
                      disabled={isBusy}
                    />
                  </label>

                  <label className="mt-4 block space-y-2 text-sm">
                    <span className="font-medium text-[#36453c]">GA click tag</span>
                    <Input
                      value={form.gaClickTag}
                      onChange={(event) => setForm((current) => ({ ...current, gaClickTag: event.target.value }))}
                      placeholder="home_slot_01_campaign_a"
                      disabled={isBusy}
                    />
                  </label>

                  <div className="mt-4 space-y-2 text-sm">
                    <span className="font-medium text-[#36453c]">Linked Spa (Location Context)</span>
                    <SpaSearchAutocomplete
                      key={selectedId ?? `new-${form.slotNumber}`}
                      value={form.spaId}
                      onChange={(id) => setForm((current) => ({ ...current, spaId: id }))}
                      disabled={isBusy}
                    />
                  </div>

                  <label className="mt-4 flex items-center gap-3 rounded-[20px] border border-[#ece5d8] bg-[#fffdf8] px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isEnabled}
                      onChange={(event) => setForm((current) => ({ ...current, isEnabled: event.target.checked }))}
                      className="h-4 w-4 accent-[#285b46]"
                      disabled={isBusy}
                    />
                    <span className="font-medium text-[#36453c]">Enable this banner on publish</span>
                  </label>
                </div>

                <div className="rounded-[24px] border border-[#ece5d8] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7453]">Locale variants</p>
                      <p className="mt-1 text-sm text-[#667065]">Edit one locale at a time. EN/KO can fall back to VI if you leave them blank.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {localeMetas.map((item) => {
                        const localeName = form.locales[item.code].name.trim();
                        const localeImage = form.locales[item.code].imageFile ?? (selectedBanner ? getBannerLocaleImage(selectedBanner, item.code) : null);
                        const isReady = Boolean(localeName && localeImage);
                        return (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => setActiveLocale(item.code)}
                            disabled={isBusy}
                            className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                              activeLocale === item.code
                                ? 'border-[#bfd5c6] bg-[#eef4ef] text-[#285b46]'
                                : getLocaleBadgeTone(isReady)
                            }`}
                          >
                            {item.shortLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {localeMetas.map((item) => {
                      const localeName = form.locales[item.code].name.trim();
                      const localeImage = form.locales[item.code].imageFile ?? (selectedBanner ? getBannerLocaleImage(selectedBanner, item.code) : null);
                      const isReady = Boolean(localeName && localeImage);
                      return (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => setActiveLocale(item.code)}
                          disabled={isBusy}
                          className={`rounded-[18px] border px-4 py-3 text-left ${
                            activeLocale === item.code
                              ? 'border-[#bfd5c6] bg-[#eef4ef]'
                              : 'border-[#ece5d8] bg-[#fffdf8]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-[#18261d]">{item.shortLabel}</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${getLocaleBadgeTone(isReady)}`}>
                              {isReady ? 'Ready' : 'Missing'}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-[#667065]">{item.helper}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-[20px] border border-[#ece5d8] bg-[#fffdf8] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7453]">{activeLocaleMeta.label}</p>
                        <p className="mt-1 text-sm text-[#667065]">{activeLocaleMeta.helper}</p>
                      </div>
                      <div className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                        activeLocale === 'vi' ? 'border-[#cfded3] bg-[#eef4ef] text-[#285b46]' : 'border-[#eadbc5] bg-[#fff7ea] text-[#9a5b1a]'
                      }`}>
                        {activeLocale === 'vi' ? 'Primary' : 'Fallback capable'}
                      </div>
                    </div>

                    <label className="mt-4 block space-y-2 text-sm">
                      <span className="font-medium text-[#36453c]">Banner name ({activeLocaleMeta.shortLabel})</span>
                      <Input
                        value={form.locales[activeLocale].name}
                        onChange={(event) => updateLocaleField(activeLocale, { name: event.target.value })}
                        placeholder={activeLocale === 'vi' ? 'Required banner title' : 'Optional localized title'}
                        required={activeLocale === 'vi'}
                        disabled={isBusy}
                      />
                    </label>

                    <label className="mt-4 block space-y-2 text-sm">
                      <span className="font-medium text-[#36453c]">Upload image ({activeLocaleMeta.shortLabel})</span>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => updateLocaleField(activeLocale, { imageFile: event.target.files?.[0] ?? null })}
                        required={activeLocale === 'vi' && !selectedBanner?.imageUrlVi}
                        disabled={isBusy}
                      />
                    </label>

                    {!!formIssues.length && (
                      <div className="mt-4 rounded-[18px] border border-[#f0d1cb] bg-[#fff8f6] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a4035]">Before saving</p>
                        <div className="mt-2 space-y-1.5 text-sm text-[#7a4037]">
                          {formIssues.map((issue) => (
                            <p key={issue}>{issue}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7453]">Preview</p>
                        {selectedBanner && activeLocale !== 'vi' && !getBannerLocaleImage(selectedBanner, activeLocale) && !form.locales[activeLocale].imageFile && (
                          <span className="text-xs text-[#9a5b1a]">Public site will fall back to VI image.</span>
                        )}
                      </div>
                      <BannerImagePreview
                        file={form.locales[activeLocale].imageFile}
                        imageUrl={activeLocalePersistedImage}
                        alt={form.locales[activeLocale].name || selectedBanner?.nameVi || 'Banner preview'}
                        emptyLabel={activeLocale === 'vi' ? 'Upload the base image for this banner.' : `No ${activeLocaleMeta.shortLabel} image yet. VI asset will be used as fallback.`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="bg-[#285b46] text-white hover:bg-[#214b3a]"
                    disabled={isBusy || !!formIssues.length}
                  >
                    {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Save />}
                    {isSubmitting ? 'Saving...' : selectedBanner ? 'Update banner' : 'Create banner'}
                  </Button>
                  <Button type="button" variant="outline" size="md" onClick={() => resetForm(null)} disabled={isBusy}>
                    Reset
                  </Button>
                  {selectedBanner && (
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      className="border-[#f0d1cb] text-[#a83d32] hover:bg-[#fff6f4]"
                      disabled={isBusy}
                      onClick={() => {
                        if (!window.confirm(`Delete banner "${selectedBanner.nameVi ?? selectedBanner.name}" from slot ${selectedBanner.slotNumber ?? '-'}?`)) {
                          return;
                        }

                        setIsDeleting(true);
                        deleteBanner(selectedBanner.id)
                          .then(() => {
                            setStatus('Banner deleted.');
                            showNotify({
                              severity: 'success',
                              title: 'Banner deleted',
                              content: 'The banner was removed successfully.',
                            });
                          })
                          .catch((deleteError) => {
                            const message = deleteError instanceof Error ? deleteError.message : 'Cannot delete banner';
                            setError(message);
                            showNotify({
                              severity: 'error',
                              title: 'Delete failed',
                              content: message,
                            });
                          })
                          .finally(() => setIsDeleting(false));
                      }}
                    >
                      {isDeleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </form>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
