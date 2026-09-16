'use client';

import { useEffect, useRef, useState, useTransition, type ChangeEvent, type KeyboardEvent } from 'react';
import { Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AdminPager } from './AdminPager';
import {
  ADMIN_API_BASE,
  ADMIN_PROXY_BASE,
  normalizePaginatedResponse,
  normalizeResponse,
  type PaginationMeta,
} from './admin-auth';

type DealSummary = {
  id: number;
  slug: string;
  title: string;
  spaId: string;
  spaName: string;
  status: string | null;
  startAt: string | null;
  endAt: string | null;
  updatedAt: string | null;
};

type SpaOption = {
  id: string;
  slug: string;
  name: string;
};

type DealDetail = {
  id: number;
  slugVi: string;
  slugEn?: string | null;
  slugKo?: string | null;
  spaId: string;
  spaName?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  titleVi: string;
  titleEn?: string | null;
  titleKo?: string | null;
  shortDescriptionVi?: string | null;
  shortDescriptionEn?: string | null;
  shortDescriptionKo?: string | null;
  contentVi?: string | null;
  contentEn?: string | null;
  contentKo?: string | null;
  coverImageUrl?: string | null;
  coverImagePreviewUrl?: string | null;
  status?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  isSoldOut?: boolean;
  priorityScore?: number | null;
  currency?: string | null;
  discountPercent?: string | null;
  discountedService?: string | null;
  priceRange?: string | null;
  source?: string | null;
  reportCount?: number | null;
};

type DealFormState = {
  spaId: string;
  titleVi: string;
  titleEn: string;
  titleKo: string;
  shortDescriptionVi: string;
  shortDescriptionEn: string;
  shortDescriptionKo: string;
  contentVi: string;
  contentEn: string;
  contentKo: string;
  coverImageUrl: string;
  status: string;
  startAt: string;
  endAt: string;
  isSoldOut: boolean;
  priorityScore: string;
  currency: string;
  discountPercent: string;
  discountedService: string;
  priceRange: string;
  reportCount: string;
};

const emptyMeta: PaginationMeta = { page: 1, limit: 20, total: 0, totalPages: 1 };
const dealStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const emptyForm: DealFormState = {
  spaId: '',
  titleVi: '',
  titleEn: '',
  titleKo: '',
  shortDescriptionVi: '',
  shortDescriptionEn: '',
  shortDescriptionKo: '',
  contentVi: '',
  contentEn: '',
  contentKo: '',
  coverImageUrl: '',
  status: 'draft',
  startAt: '',
  endAt: '',
  isSoldOut: false,
  priorityScore: '0',
  currency: 'VND',
  discountPercent: '',
  discountedService: '',
  priceRange: '',
  reportCount: '0',
};

function toNullableNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInputDateTime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toForm(detail?: DealDetail | null): DealFormState {
  if (!detail) return emptyForm;
  return {
    spaId: detail.spaId ?? '',
    titleVi: detail.titleVi ?? '',
    titleEn: detail.titleEn ?? '',
    titleKo: detail.titleKo ?? '',
    shortDescriptionVi: detail.shortDescriptionVi ?? '',
    shortDescriptionEn: detail.shortDescriptionEn ?? '',
    shortDescriptionKo: detail.shortDescriptionKo ?? '',
    contentVi: detail.contentVi ?? '',
    contentEn: detail.contentEn ?? '',
    contentKo: detail.contentKo ?? '',
    coverImageUrl: detail.coverImageUrl ?? '',
    status: detail.status ?? 'draft',
    startAt: toInputDateTime(detail.startAt),
    endAt: toInputDateTime(detail.endAt),
    isSoldOut: detail.isSoldOut ?? false,
    priorityScore: detail.priorityScore == null ? '0' : String(detail.priorityScore),
    currency: detail.currency ?? 'VND',
    discountPercent: detail.discountPercent ?? '',
    discountedService: detail.discountedService ?? '',
    priceRange: detail.priceRange ?? '',
    reportCount: detail.reportCount == null ? '0' : String(detail.reportCount),
  };
}

function resolveAdminImageSrc(url: string): string {
  if (!url.startsWith('/')) return url;
  return `${ADMIN_API_BASE}${url}`;
}

function buildInheritedCategoryLabel(detail?: Pick<DealDetail, 'categoryName' | 'categorySlug'> | null): string {
  if (!detail?.categoryName) return '';
  if (!detail.categorySlug) return detail.categoryName;
  return `${detail.categoryName} (${detail.categorySlug})`;
}

export function AdminDealPage() {
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<DealSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<DealFormState>(emptyForm);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedSpa, setSelectedSpa] = useState<SpaOption | null>(null);
  const [inheritedCategoryLabel, setInheritedCategoryLabel] = useState('');
  const [spaDialogOpen, setSpaDialogOpen] = useState(false);
  const [spaQuery, setSpaQuery] = useState('');
  const [spaItems, setSpaItems] = useState<SpaOption[]>([]);
  const [spaMeta, setSpaMeta] = useState<PaginationMeta>(emptyMeta);
  const [spaPage, setSpaPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  async function loadDeals(nextQuery = activeQuery, page = meta.page || 1) {
    const search = new URLSearchParams();
    if (nextQuery.trim()) search.set('q', nextQuery.trim());
    search.set('page', String(page));
    search.set('limit', '12');

    const response = await fetch(`${ADMIN_PROXY_BASE}/deals?${search.toString()}`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Load deals failed: ${response.status}`);

    const payload = normalizePaginatedResponse<DealSummary>(await response.json());
    setItems(payload.data);
    setMeta(payload.meta);

    if (selectedId && payload.data.some((item) => item.id === selectedId)) {
      return;
    }

    if (payload.data[0]) {
      await selectItem(payload.data[0].id);
      return;
    }

    setSelectedId(null);
    setSelectedSpa(null);
    setInheritedCategoryLabel('');
    setForm(emptyForm);
  }

  async function loadSpaOptions(nextQuery = spaQuery, page = spaPage) {
    const search = new URLSearchParams();
    if (nextQuery.trim()) search.set('q', nextQuery.trim());
    search.set('page', String(page));
    search.set('limit', '10');

    const response = await fetch(`${ADMIN_PROXY_BASE}/spas?${search.toString()}`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Load spas failed: ${response.status}`);

    const payload = normalizePaginatedResponse<SpaOption>(await response.json());
    setSpaItems(payload.data);
    setSpaMeta(payload.meta);
  }

  async function loadSpaLabel(id: string) {
    const response = await fetch(`${ADMIN_PROXY_BASE}/spas/${id}`, {
      cache: 'no-store',
    });
    if (!response.ok) return;
    const payload = normalizeResponse<{ id: string; slug: string; name: string }>(await response.json());
    setSelectedSpa({ id: payload.id, slug: payload.slug, name: payload.name });
  }

  async function selectItem(id: number | null) {
    setSelectedId(id);
    setError('');
    setStatusMessage('');

    if (id == null) {
      setForm(emptyForm);
      setCoverPreviewUrl('');
      setSelectedSpa(null);
      setInheritedCategoryLabel('');
      return;
    }

    const response = await fetch(`${ADMIN_PROXY_BASE}/deals/${id}`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Load deal detail failed: ${response.status}`);

    const payload = normalizeResponse<DealDetail>(await response.json());
    setForm(toForm(payload));
    setCoverPreviewUrl(payload.coverImagePreviewUrl ?? payload.coverImageUrl ?? '');
    setInheritedCategoryLabel(buildInheritedCategoryLabel(payload));

    if (payload.spaId) {
      const listSpa = items.find((item) => item.spaId === payload.spaId);
      setSelectedSpa(listSpa ? { id: payload.spaId, slug: '', name: listSpa.spaName } : null);
      if (!listSpa) await loadSpaLabel(payload.spaId);
    } else {
      setSelectedSpa(null);
    }
  }

  useEffect(() => {
    startTransition(() => {
      loadDeals('', 1).catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Cannot load deals');
      });
    });
  }, []);

  useEffect(() => {
    if (!spaDialogOpen) return;
    void loadSpaOptions().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Cannot load spas');
    });
  }, [spaDialogOpen, spaPage]);

  function updateField<K extends keyof DealFormState>(key: K, value: DealFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>, onSearch: () => void) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    onSearch();
  }

  async function handleCoverUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setError('');

    try {
      const body = new FormData();
      body.append('file', file);

      const response = await fetch(`${ADMIN_PROXY_BASE}/deals/cover-upload`, {
        method: 'POST',
        body,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Upload cover failed: ${response.status}`);
      }

      const payload = normalizeResponse<{ url: string; previewUrl?: string | null }>(await response.json());
      updateField('coverImageUrl', payload.url);
      setCoverPreviewUrl(payload.previewUrl ?? payload.url);
      setStatusMessage('Cover image uploaded');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Cannot upload cover');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  }

  async function save() {
    setError('');
    setStatusMessage('');

    if (!form.titleVi.trim()) {
      setError('Title VI is required');
      return;
    }
    if (!form.titleEn.trim()) {
      setError('Title EN is required');
      return;
    }
    if (!form.titleKo.trim()) {
      setError('Title KO is required');
      return;
    }
    if (!form.contentVi.trim()) {
      setError('Content VI is required');
      return;
    }
    if (!form.contentEn.trim()) {
      setError('Content EN is required');
      return;
    }
    if (!form.contentKo.trim()) {
      setError('Content KO is required');
      return;
    }

    const payload = {
      spaId: form.spaId,
      titleVi: form.titleVi,
      titleEn: form.titleEn || null,
      titleKo: form.titleKo || null,
      shortDescriptionVi: form.shortDescriptionVi || null,
      shortDescriptionEn: form.shortDescriptionEn || null,
      shortDescriptionKo: form.shortDescriptionKo || null,
      contentVi: form.contentVi || null,
      contentEn: form.contentEn || null,
      contentKo: form.contentKo || null,
      coverImageUrl: form.coverImageUrl || null,
      status: form.status || 'draft',
      startAt: form.startAt || null,
      endAt: form.endAt || null,
      isSoldOut: form.isSoldOut,
      priorityScore: toNullableNumber(form.priorityScore) ?? 0,
      currency: form.currency || 'VND',
      discountPercent: form.discountPercent || null,
      discountedService: form.discountedService || null,
      priceRange: form.priceRange || null,
      reportCount: toNullableNumber(form.reportCount) ?? 0,
    };

    const url = selectedId != null
      ? `${ADMIN_PROXY_BASE}/deals/${selectedId}`
      : `${ADMIN_PROXY_BASE}/deals`;

    const response = await fetch(url, {
      method: selectedId != null ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Save deal failed: ${response.status}`);
    }

    const saved = normalizeResponse<DealDetail>(await response.json());
    setSelectedId(saved.id);
    setForm(toForm(saved));
    setCoverPreviewUrl(saved.coverImagePreviewUrl ?? saved.coverImageUrl ?? '');
    setInheritedCategoryLabel(buildInheritedCategoryLabel(saved));
    setStatusMessage(`Saved deal: ${saved.slugVi}`);
    await loadDeals(activeQuery, meta.page);
  }

  async function remove() {
    if (selectedId == null) return;
    if (!window.confirm('Delete this deal?')) return;

    const response = await fetch(`${ADMIN_PROXY_BASE}/deals/${selectedId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Delete deal failed: ${response.status}`);

    setSelectedId(null);
    setSelectedSpa(null);
    setInheritedCategoryLabel('');
    setForm(emptyForm);
    setStatusMessage('Deal deleted');
    await loadDeals(activeQuery, 1);
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-[#e7dfcf] bg-white p-5 shadow-[0_18px_50px_-42px_rgba(24,38,29,0.55)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#6d756a]">Supply inventory</p>
              <h3 className="text-xl font-semibold text-[#17241c]">Deals</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedId(null);
                setSelectedSpa(null);
                setInheritedCategoryLabel('');
                setForm(emptyForm);
                setStatusMessage('Creating a new deal');
              }}
            >
              New
            </Button>
          </div>

          <div className="mt-4 flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(event) => handleSearchKeyDown(event, () => {
                setActiveQuery(query.trim());
                void loadDeals(query.trim(), 1).catch((err) => setError(err instanceof Error ? err.message : 'Cannot search'));
              })}
              placeholder="Search title, slug, spa"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActiveQuery(query.trim());
                void loadDeals(query.trim(), 1).catch((err) => setError(err instanceof Error ? err.message : 'Cannot search'));
              }}
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectItem(item.id).catch((err) => setError(err instanceof Error ? err.message : 'Cannot load deal'))}
                className={`w-full rounded-[20px] border px-4 py-3 text-left transition ${
                  selectedId === item.id ? 'border-[#31513f] bg-[#eef5ef]' : 'border-[#ece5d8] bg-[#fbfaf7]'
                }`}
              >
                <p className="font-medium text-[#16231b]">{item.title}</p>
                <p className="mt-1 text-xs text-[#6d756a]">{item.slug}</p>
                <p className="mt-1 text-xs text-[#6d756a]">{item.spaName} · {item.status ?? 'draft'}</p>
              </button>
            ))}
            {!items.length && (
              <div className="rounded-[20px] border border-dashed border-[#e7dfcf] px-4 py-6 text-sm text-[#6d756a]">
                {isPending ? 'Loading deals...' : 'No deals found.'}
              </div>
            )}
          </div>

          <AdminPager
            meta={meta}
            onPageChange={(page) => {
              void loadDeals(activeQuery, page).catch((err) => setError(err instanceof Error ? err.message : 'Cannot change page'));
            }}
          />
        </section>

        <section className="rounded-[28px] border border-[#e7dfcf] bg-white p-6 shadow-[0_18px_50px_-42px_rgba(24,38,29,0.55)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#6d756a]">Editor</p>
              <h3 className="text-xl font-semibold text-[#17241c]">{selectedId != null ? 'Edit deal' : 'Create deal'}</h3>
            </div>
            <div className="flex gap-2">
              {selectedId != null && (
                <Button type="button" variant="outline" onClick={() => remove().catch((err) => setError(err instanceof Error ? err.message : 'Cannot delete deal'))}>
                  Delete
                </Button>
              )}
              <Button type="button" onClick={() => save().catch((err) => setError(err instanceof Error ? err.message : 'Cannot save deal'))}>
                Save
              </Button>
            </div>
          </div>

          {statusMessage && <p className="mt-4 rounded-[16px] bg-[#eef6ef] px-4 py-3 text-sm text-[#2e5a42]">{statusMessage}</p>}
          {error && <p className="mt-4 rounded-[16px] bg-[#fff1ee] px-4 py-3 text-sm text-[#9a3d2f]">{error}</p>}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-[#ece5d8] bg-[#fbfaf7] p-3 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#17241c]">Spa</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSpaDialogOpen(true);
                    setSpaPage(1);
                  }}
                >
                  Choose
                </Button>
              </div>
              <p className="mt-3 text-sm text-[#36453c]">
                {selectedSpa ? `${selectedSpa.name}${selectedSpa.slug ? ` (${selectedSpa.slug})` : ''}` : 'No spa selected'}
              </p>
              <p className="mt-1 text-xs text-[#6d756a]">
                {inheritedCategoryLabel ? `Inherited category: ${inheritedCategoryLabel}` : 'Inherited category will be resolved from the selected spa when you save.'}
              </p>
            </div>

            <Input value={form.titleVi} onChange={(e) => updateField('titleVi', e.target.value)} placeholder="Title VI *" />
            <Input value={form.titleEn} onChange={(e) => updateField('titleEn', e.target.value)} placeholder="Title EN *" />
            <Input value={form.titleKo} onChange={(e) => updateField('titleKo', e.target.value)} placeholder="Title KO *" />

            <div className="rounded-[20px] border border-[#ece5d8] bg-[#fbfaf7] p-4 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#17241c]">Cover image</p>
                </div>
                <div className="flex gap-2">
                  {form.coverImageUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateField('coverImageUrl', '');
                        setCoverPreviewUrl('');
                      }}
                    >
                      Clear
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="sm" disabled={isUploadingCover} onClick={() => coverInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    {isUploadingCover ? 'Uploading...' : 'Upload'}
                  </Button>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </div>
              </div>

              {coverPreviewUrl || form.coverImageUrl ? (
                <div className="mt-4 overflow-hidden rounded-[18px] border border-[#e7dfcf] bg-white">
                  <img
                    src={resolveAdminImageSrc(coverPreviewUrl || form.coverImageUrl)}
                    alt={form.titleVi || 'Deal cover preview'}
                    className="h-56 w-full object-cover"
                  />
                  <p className="border-t border-[#f0e7d8] px-3 py-2 text-xs text-[#6d756a]">{form.coverImageUrl}</p>
                </div>
              ) : (
                <div className="mt-4 rounded-[18px] border border-dashed border-[#d9d3c6] px-4 py-8 text-sm text-[#6d756a]">
                  No cover image uploaded.
                </div>
              )}
            </div>

            <label className="grid gap-2 text-sm text-[#36453c]">
              <span className="font-medium text-[#17241c]">Status</span>
              <select
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="h-12 rounded-[16px] border border-[#d9d3c6] bg-white px-3 text-sm text-[#17241c] outline-none transition focus:border-[#31513f]"
              >
                {dealStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Input value={form.currency} onChange={(e) => updateField('currency', e.target.value)} placeholder="Currency" />
            <Input type="datetime-local" value={form.startAt} onChange={(e) => updateField('startAt', e.target.value)} placeholder="Start at" />
            <Input type="datetime-local" value={form.endAt} onChange={(e) => updateField('endAt', e.target.value)} placeholder="End at" />
            <Input value={form.priorityScore} onChange={(e) => updateField('priorityScore', e.target.value)} placeholder="Priority score" />
            <Input value={form.reportCount} onChange={(e) => updateField('reportCount', e.target.value)} placeholder="Report count" />
            <Input value={form.discountPercent} onChange={(e) => updateField('discountPercent', e.target.value)} placeholder="Discount percent" />
            <Input value={form.discountedService} onChange={(e) => updateField('discountedService', e.target.value)} placeholder="Discounted service" />
            <Input value={form.priceRange} onChange={(e) => updateField('priceRange', e.target.value)} placeholder="Price range" />
            <label className="flex items-center gap-3 rounded-xl border border-[#d9d3c6] px-3 py-2 text-sm text-[#36453c]">
              <input type="checkbox" checked={form.isSoldOut} onChange={(e) => updateField('isSoldOut', e.target.checked)} />
              Sold out
            </label>
          </div>

          <div className="mt-4 grid gap-4">
            <Textarea value={form.shortDescriptionVi} onChange={(e) => updateField('shortDescriptionVi', e.target.value)} placeholder="Short description VI" rows={2} />
            <Textarea value={form.shortDescriptionEn} onChange={(e) => updateField('shortDescriptionEn', e.target.value)} placeholder="Short description EN" rows={2} />
            <Textarea value={form.shortDescriptionKo} onChange={(e) => updateField('shortDescriptionKo', e.target.value)} placeholder="Short description KO" rows={2} />
            <Textarea value={form.contentVi} onChange={(e) => updateField('contentVi', e.target.value)} placeholder="Content VI *" rows={4} />
            <Textarea value={form.contentEn} onChange={(e) => updateField('contentEn', e.target.value)} placeholder="Content EN *" rows={4} />
            <Textarea value={form.contentKo} onChange={(e) => updateField('contentKo', e.target.value)} placeholder="Content KO *" rows={4} />
          </div>
        </section>
      </div>

      <Dialog open={spaDialogOpen} onOpenChange={setSpaDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select spa</DialogTitle>
            <DialogDescription>Search the spa inventory from the admin API and choose one result.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex gap-2">
              <Input
                value={spaQuery}
                onChange={(e) => setSpaQuery(e.target.value)}
                onKeyDown={(event) => handleSearchKeyDown(event, () => {
                  setSpaPage(1);
                  void loadSpaOptions(spaQuery, 1).catch((err) => setError(err instanceof Error ? err.message : 'Cannot search spas'));
                })}
                placeholder="Search spa name or slug"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSpaPage(1);
                  void loadSpaOptions(spaQuery, 1).catch((err) => setError(err instanceof Error ? err.message : 'Cannot search spas'));
                }}
              >
                Search
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {spaItems.map((spa) => (
                <button
                  key={spa.id}
                  type="button"
                  onClick={() => {
                    setSelectedSpa(spa);
                    setInheritedCategoryLabel('');
                    updateField('spaId', spa.id);
                    setSpaDialogOpen(false);
                  }}
                  className={`w-full rounded-[18px] border px-4 py-3 text-left ${
                    form.spaId === spa.id ? 'border-[#31513f] bg-[#eef5ef]' : 'border-[#ece5d8] bg-white'
                  }`}
                >
                  <p className="font-medium text-[#17241c]">{spa.name}</p>
                  <p className="text-xs text-[#6d756a]">{spa.slug}</p>
                </button>
              ))}
              {!spaItems.length && (
                <div className="rounded-[18px] border border-dashed border-[#e7dfcf] px-4 py-6 text-sm text-[#6d756a]">
                  No spas found.
                </div>
              )}
            </div>

            <AdminPager
              meta={spaMeta}
              onPageChange={(page) => {
                setSpaPage(page);
                void loadSpaOptions(spaQuery, page).catch((err) => setError(err instanceof Error ? err.message : 'Cannot change page'));
              }}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
