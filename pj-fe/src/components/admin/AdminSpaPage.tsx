'use client';

import { useEffect, useRef, useState, useTransition, type ChangeEvent, type KeyboardEvent } from 'react';
import { ChevronDown, ChevronUp, Search, Upload, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AdminPager } from './AdminPager';
import {
  ADMIN_API_BASE,
  ADMIN_PROXY_BASE,
  normalizePaginatedResponse,
  normalizeResponse,
  type PaginationMeta,
} from './admin-auth';

type SpaSummary = {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  website: string | null;
  cityName: string | null;
  districtName: string | null;
  updatedAt: string | null;
};

type ServiceOption = {
  id: number;
  nameVi: string;
  slugGlobal: string;
  code: string;
  sortOrder: number;
};

type LocationSelection = {
  cityId: number | null;
  citySlug: string;
  cityName: string;
  districtId: number | null;
  districtSlug: string;
  districtName: string;
  placeId: number | null;
  placeSlug: string;
  placeName: string;
  addressLine: string;
  lat: string;
  lng: string;
};

type GalleryItem = {
  imageUrl: string;
  previewUrl?: string | null;
  sortOrder?: number;
};

type OpeningHourRow = {
  day: number;
  enabled: boolean;
  openTime: string;
  closeTime: string;
};

type SpaDetail = {
  id: string;
  slug: string;
  slugVi: string;
  slugEn: string;
  slugKo: string;
  name: string;
  nameVi?: string | null;
  nameEn?: string | null;
  nameKo?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  descriptionVi?: string | null;
  descriptionEn?: string | null;
  descriptionKo?: string | null;
  province?: string | null;
  googlePlaceId?: string | null;
  googleMapsUri?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ratingValue?: number | null;
  reviewCount?: number | null;
  messagingLinkZalo?: string | null;
  messagingLinkWhatsapp?: string | null;
  messagingLinkTelegram?: string | null;
  messagingLinkMessenger?: string | null;
  messagingLinkKakaotalk?: string | null;
  facebookLink?: string | null;
  instagramLink?: string | null;
  twitterLink?: string | null;
  serviceIds?: number[];
  services?: ServiceOption[];
  openingHours?: Record<string, unknown> | null;
  spaAvatar?: string | null;
  location?: {
    cityId?: number | null;
    citySlug?: string | null;
    cityName?: string | null;
    districtId?: number | null;
    districtSlug?: string | null;
    districtName?: string | null;
    placeId?: number | null;
    placeSlug?: string | null;
    placeName?: string | null;
    addressLine?: string | null;
    lat?: number | null;
    lng?: number | null;
  } | null;
  galleries?: GalleryItem[];
  spaAvatarPreviewUrl?: string | null;
};

type SpaFormState = {
  name: string;
  address: string;
  phone: string;
  website: string;
  province: string;
  googlePlaceId: string;
  googleMapsUri: string;
  latitude: string;
  longitude: string;
  ratingValue: string;
  messagingLinkZalo: string;
  messagingLinkWhatsapp: string;
  messagingLinkTelegram: string;
  messagingLinkMessenger: string;
  messagingLinkKakaotalk: string;
  facebookLink: string;
  instagramLink: string;
  twitterLink: string;
  spaAvatar: string;
  serviceIds: number[];
  services: ServiceOption[];
};

type CityOption = {
  id: number;
  slug: string;
  nameVi: string;
};

type DistrictOption = {
  id: number;
  slug: string;
  nameVi: string;
  cityId: number;
};

type PlaceOption = {
  id: number;
  slug: string;
  nameVi: string;
  districtId?: number | null;
  cityId?: number | null;
};

const emptyMeta: PaginationMeta = { page: 1, limit: 20, total: 0, totalPages: 1 };
const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function resolveAdminImageSrc(url: string): string {
  if (!url.startsWith('/')) return url;
  return `${ADMIN_API_BASE}${url}`;
}

const emptyForm: SpaFormState = {
  name: '',
  address: '',
  phone: '',
  website: '',
  province: '',
  googlePlaceId: '',
  googleMapsUri: '',
  latitude: '',
  longitude: '',
  ratingValue: '',
  messagingLinkZalo: '',
  messagingLinkWhatsapp: '',
  messagingLinkTelegram: '',
  messagingLinkMessenger: '',
  messagingLinkKakaotalk: '',
  facebookLink: '',
  instagramLink: '',
  twitterLink: '',
  spaAvatar: '',
  serviceIds: [],
  services: [],
};

function defaultOpeningHours(): OpeningHourRow[] {
  return dayLabels.map((_, day) => ({
    day,
    enabled: false,
    openTime: '09:00',
    closeTime: '22:00',
  }));
}

function emptyLocation(): LocationSelection {
  return {
    cityId: null,
    citySlug: '',
    cityName: '',
    districtId: null,
    districtSlug: '',
    districtName: '',
    placeId: null,
    placeSlug: '',
    placeName: '',
    addressLine: '',
    lat: '',
    lng: '',
  };
}

function toNullableNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatTimeParts(hour?: unknown, minute?: unknown): string {
  const parsedHour = typeof hour === 'number' ? hour : Number(hour ?? 0);
  const parsedMinute = typeof minute === 'number' ? minute : Number(minute ?? 0);
  const hh = Number.isFinite(parsedHour) ? String(parsedHour).padStart(2, '0') : '00';
  const mm = Number.isFinite(parsedMinute) ? String(parsedMinute).padStart(2, '0') : '00';
  return `${hh}:${mm}`;
}

function parseOpeningHours(raw?: Record<string, unknown> | null): OpeningHourRow[] {
  const base = defaultOpeningHours();
  const periods = Array.isArray(raw?.periods) ? raw.periods : [];
  for (const period of periods) {
    if (!period || typeof period !== 'object') continue;
    const open = (period as { open?: Record<string, unknown> }).open;
    const close = (period as { close?: Record<string, unknown> }).close;
    const day = typeof open?.day === 'number' ? open.day : Number(open?.day);
    if (!Number.isInteger(day) || day < 0 || day > 6) continue;
    base[day] = {
      day,
      enabled: true,
      openTime: formatTimeParts(open?.hour, open?.minute),
      closeTime: formatTimeParts(close?.hour, close?.minute),
    };
  }
  return base;
}

function buildOpeningHoursPayload(rows: OpeningHourRow[]): Record<string, unknown> | null {
  const periods = rows
    .filter((row) => row.enabled)
    .map((row) => {
      const [openHour, openMinute] = row.openTime.split(':').map((value) => Number(value));
      const [closeHour, closeMinute] = row.closeTime.split(':').map((value) => Number(value));
      return {
        open: { day: row.day, hour: openHour || 0, minute: openMinute || 0 },
        close: { day: row.day, hour: closeHour || 0, minute: closeMinute || 0 },
      };
    });

  return periods.length ? { periods } : null;
}

function hasLocationValue(location: LocationSelection): boolean {
  return Boolean(
    location.cityId
    || location.districtId
    || location.placeId
    || location.addressLine.trim()
    || location.lat.trim()
    || location.lng.trim(),
  );
}

function toForm(detail?: SpaDetail | null): SpaFormState {
  if (!detail) return emptyForm;
  return {
    name: detail.name ?? '',
    address: detail.address ?? '',
    phone: detail.phone ?? '',
    website: detail.website ?? '',
    province: detail.province ?? '',
    googlePlaceId: detail.googlePlaceId ?? '',
    googleMapsUri: detail.googleMapsUri ?? '',
    latitude: detail.latitude == null ? '' : String(detail.latitude),
    longitude: detail.longitude == null ? '' : String(detail.longitude),
    ratingValue: detail.ratingValue == null ? '' : String(detail.ratingValue),
    messagingLinkZalo: detail.messagingLinkZalo ?? '',
    messagingLinkWhatsapp: detail.messagingLinkWhatsapp ?? '',
    messagingLinkTelegram: detail.messagingLinkTelegram ?? '',
    messagingLinkMessenger: detail.messagingLinkMessenger ?? '',
    messagingLinkKakaotalk: detail.messagingLinkKakaotalk ?? '',
    facebookLink: detail.facebookLink ?? '',
    instagramLink: detail.instagramLink ?? '',
    twitterLink: detail.twitterLink ?? '',
    spaAvatar: detail.spaAvatar ?? '',
    serviceIds: detail.serviceIds ?? detail.services?.map((service) => service.id) ?? [],
    services: detail.services ?? [],
  };
}

function toLocationState(detail?: SpaDetail | null): LocationSelection {
  return {
    cityId: detail?.location?.cityId ?? null,
    citySlug: detail?.location?.citySlug ?? '',
    cityName: detail?.location?.cityName ?? '',
    districtId: detail?.location?.districtId ?? null,
    districtSlug: detail?.location?.districtSlug ?? '',
    districtName: detail?.location?.districtName ?? '',
    placeId: detail?.location?.placeId ?? null,
    placeSlug: detail?.location?.placeSlug ?? '',
    placeName: detail?.location?.placeName ?? '',
    addressLine: detail?.location?.addressLine ?? '',
    lat: detail?.location?.lat == null ? '' : String(detail.location.lat),
    lng: detail?.location?.lng == null ? '' : String(detail.location.lng),
  };
}

function normalizeGalleries(items: GalleryItem[]): GalleryItem[] {
  return items
    .filter((item) => item.imageUrl.trim())
    .map((item, index) => ({
      imageUrl: item.imageUrl.trim(),
      previewUrl: item.previewUrl?.trim() || item.imageUrl.trim(),
      sortOrder: index,
    }));
}

function FieldCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-[#ece5d8] bg-[#fbfaf7] p-4">
      <div className="mb-3">
        <p className="text-sm font-medium text-[#17241c]">{title}</p>
        {description ? <p className="text-xs text-[#6d756a]">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function AdminSpaPage() {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const [items, setItems] = useState<SpaSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<SpaFormState>(emptyForm);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [location, setLocation] = useState<LocationSelection>(emptyLocation);
  const [openingHours, setOpeningHours] = useState<OpeningHourRow[]>(defaultOpeningHours);
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [serviceQuery, setServiceQuery] = useState('');
  const [serviceItems, setServiceItems] = useState<ServiceOption[]>([]);

  const [serviceMeta, setServiceMeta] = useState<PaginationMeta>(emptyMeta);
  const [servicePage, setServicePage] = useState(1);

  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [cityItems, setCityItems] = useState<CityOption[]>([]);
  const [cityMeta, setCityMeta] = useState<PaginationMeta>(emptyMeta);
  const [cityPage, setCityPage] = useState(1);

  const [districtDialogOpen, setDistrictDialogOpen] = useState(false);
  const [districtItems, setDistrictItems] = useState<DistrictOption[]>([]);
  const [districtMeta, setDistrictMeta] = useState<PaginationMeta>(emptyMeta);
  const [districtPage, setDistrictPage] = useState(1);

  const [placeDialogOpen, setPlaceDialogOpen] = useState(false);
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeItems, setPlaceItems] = useState<PlaceOption[]>([]);
  const [placeMeta, setPlaceMeta] = useState<PaginationMeta>(emptyMeta);
  const [placePage, setPlacePage] = useState(1);

  const [isPending, startTransition] = useTransition();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  function resetEditor(detail?: SpaDetail | null) {
    setForm(toForm(detail));
    setAvatarPreviewUrl(detail?.spaAvatarPreviewUrl ?? detail?.spaAvatar ?? '');
    setLocation(toLocationState(detail));
    setOpeningHours(parseOpeningHours(detail?.openingHours));
    setGalleries(normalizeGalleries(detail?.galleries ?? []));
  }

  async function loadList(nextQuery = activeQuery, page = meta.page || 1) {
    const search = new URLSearchParams();
    if (nextQuery.trim()) search.set('q', nextQuery.trim());
    search.set('page', String(page));
    search.set('limit', '12');

    const response = await fetch(`${ADMIN_PROXY_BASE}/spas?${search.toString()}`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Load spas failed: ${response.status}`);

    const payload = normalizePaginatedResponse<SpaSummary>(await response.json());
    setItems(payload.data);
    setMeta(payload.meta);

    if (selectedId && payload.data.some((item) => item.id === selectedId)) return;

    if (payload.data[0]) {
      await selectItem(payload.data[0].id);
      return;
    }

    setSelectedId(null);
    resetEditor(null);
  }

  async function loadServices(nextQuery = serviceQuery, page = servicePage) {
    const search = new URLSearchParams();
    if (nextQuery.trim()) search.set('q', nextQuery.trim());
    search.set('page', String(page));
    search.set('limit', '10');

    const response = await fetch(`${ADMIN_PROXY_BASE}/services?${search.toString()}`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Load services failed: ${response.status}`);

    const payload = normalizePaginatedResponse<ServiceOption>(await response.json());
    setServiceItems(payload.data);
    setServiceMeta(payload.meta);
  }

  async function loadCities(page = cityPage) {
    const search = new URLSearchParams();
    search.set('page', String(page));
    search.set('limit', '12');

    const response = await fetch(`${ADMIN_API_BASE}/api/v1/locations/cities?${search.toString()}`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Load cities failed: ${response.status}`);

    const payload = normalizePaginatedResponse<CityOption>(await response.json());
    setCityItems(payload.data);
    setCityMeta(payload.meta);
  }

  async function loadDistricts(page = districtPage) {
    if (!location.citySlug) {
      setDistrictItems([]);
      setDistrictMeta(emptyMeta);
      return;
    }

    const search = new URLSearchParams();
    search.set('page', String(page));
    search.set('limit', '12');

    const response = await fetch(`${ADMIN_API_BASE}/api/v1/locations/cities/${location.citySlug}/districts?${search.toString()}`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Load districts failed: ${response.status}`);

    const payload = normalizePaginatedResponse<DistrictOption>(await response.json());
    setDistrictItems(payload.data);
    setDistrictMeta(payload.meta);
  }

  async function loadPlaces(nextQuery = placeQuery, page = placePage) {
    if (!location.districtSlug) {
      setPlaceItems([]);
      setPlaceMeta(emptyMeta);
      return;
    }

    const search = new URLSearchParams();
    if (nextQuery.trim()) search.set('q', nextQuery.trim());
    search.set('page', String(page));
    search.set('limit', '10');

    const response = await fetch(`${ADMIN_API_BASE}/api/v1/locations/districts/${location.districtSlug}/places?${search.toString()}`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Load places failed: ${response.status}`);

    const payload = normalizePaginatedResponse<PlaceOption>(await response.json());
    setPlaceItems(payload.data);
    setPlaceMeta(payload.meta);
  }

  async function selectItem(id: string | null) {
    setSelectedId(id);
    setError('');
    setStatus('');

    if (!id) {
      resetEditor(null);
      return;
    }

    const response = await fetch(`${ADMIN_PROXY_BASE}/spas/${id}`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Load spa detail failed: ${response.status}`);
    const payload = normalizeResponse<SpaDetail>(await response.json());
    resetEditor(payload);
  }

  useEffect(() => {
    startTransition(() => {
      loadList('', 1).catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Cannot load spas');
      });
    });
  }, []);

  useEffect(() => {
    if (!serviceDialogOpen) return;
    void loadServices().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Cannot load services');
    });
  }, [serviceDialogOpen, servicePage]);

  useEffect(() => {
    if (!cityDialogOpen) return;
    void loadCities().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Cannot load cities');
    });
  }, [cityDialogOpen, cityPage]);

  useEffect(() => {
    if (!districtDialogOpen) return;
    void loadDistricts().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Cannot load districts');
    });
  }, [districtDialogOpen, districtPage, location.citySlug]);

  useEffect(() => {
    if (!placeDialogOpen) return;
    void loadPlaces().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Cannot load places');
    });
  }, [placeDialogOpen, placePage, location.districtSlug]);


  function updateField<K extends keyof SpaFormState>(key: K, value: SpaFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateLocationField<K extends keyof LocationSelection>(key: K, value: LocationSelection[K]) {
    setLocation((current) => ({ ...current, [key]: value }));
  }

  function toggleService(service: ServiceOption) {
    setForm((current) => ({
      ...current,
      serviceIds: current.serviceIds.includes(service.id)
        ? current.serviceIds.filter((item) => item !== service.id)
        : [...current.serviceIds, service.id],
      services: current.serviceIds.includes(service.id)
        ? current.services.filter((item) => item.id !== service.id)
        : [...current.services, service].sort((left, right) => left.sortOrder - right.sortOrder || left.nameVi.localeCompare(right.nameVi)),
    }));
  }

  function updateOpeningHour(day: number, patch: Partial<OpeningHourRow>) {
    setOpeningHours((current) => current.map((row) => (row.day === day ? { ...row, ...patch } : row)));
  }

  function onEnterSearch(event: KeyboardEvent<HTMLInputElement>, run: () => void) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    run();
  }

  function chooseCity(city: CityOption) {
    setLocation({
      cityId: city.id,
      citySlug: city.slug,
      cityName: city.nameVi,
      districtId: null,
      districtSlug: '',
      districtName: '',
      placeId: null,
      placeSlug: '',
      placeName: '',
      addressLine: location.addressLine,
      lat: location.lat,
      lng: location.lng,
    });
    setCityDialogOpen(false);
    setDistrictPage(1);
    setPlacePage(1);
    setPlaceQuery('');
  }

  function chooseDistrict(district: DistrictOption) {
    setLocation((current) => ({
      ...current,
      districtId: district.id,
      districtSlug: district.slug,
      districtName: district.nameVi,
      placeId: null,
      placeSlug: '',
      placeName: '',
    }));
    setDistrictDialogOpen(false);
    setPlacePage(1);
    setPlaceQuery('');
  }

  function choosePlace(place: PlaceOption) {
    setLocation((current) => ({
      ...current,
      placeId: place.id,
      placeSlug: place.slug,
      placeName: place.nameVi,
    }));
    setPlaceDialogOpen(false);
  }

  function removeGallery(index: number) {
    setGalleries((current) => normalizeGalleries(current.filter((_, itemIndex) => itemIndex !== index)));
  }

  function moveGallery(index: number, direction: -1 | 1) {
    setGalleries((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const currentItem = next[index];
      const targetItem = next[nextIndex];
      if (!currentItem || !targetItem) return current;
      next[index] = targetItem;
      next[nextIndex] = currentItem;
      return normalizeGalleries(next);
    });
  }

  async function handleGalleryUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setIsUploadingGallery(true);
    setError('');

    try {
      const uploaded: GalleryItem[] = [];
      for (const file of files) {
        const body = new FormData();
        body.append('file', file);

        const response = await fetch(`${ADMIN_PROXY_BASE}/spas/gallery-upload`, {
          method: 'POST',
          body,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Upload gallery failed: ${response.status}`);
        }

        const payload = normalizeResponse<{ url: string; previewUrl?: string | null }>(await response.json());
        uploaded.push({ imageUrl: payload.url, previewUrl: payload.previewUrl ?? payload.url });
      }

      setGalleries((current) => normalizeGalleries([...current, ...uploaded]));
      setStatus(`Uploaded ${uploaded.length} gallery image${uploaded.length > 1 ? 's' : ''}`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Cannot upload gallery');
    } finally {
      setIsUploadingGallery(false);
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setError('');

    try {
      const body = new FormData();
      body.append('file', file);

      const response = await fetch(`${ADMIN_PROXY_BASE}/spas/avatar-upload`, {
        method: 'POST',
        body,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Upload avatar failed: ${response.status}`);
      }

      const payload = normalizeResponse<{ url: string; previewUrl?: string | null }>(await response.json());
      updateField('spaAvatar', payload.url);
      setAvatarPreviewUrl(payload.previewUrl ?? payload.url);
      setStatus('Avatar uploaded');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Cannot upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }

  async function save() {
    setError('');
    setStatus('');

    const payload = {
      name: form.name,
      address: form.address || null,
      phone: form.phone || null,
      website: form.website || null,
      province: form.province || null,
      googlePlaceId: form.googlePlaceId || null,
      googleMapsUri: form.googleMapsUri || null,
      latitude: toNullableNumber(form.latitude),
      longitude: toNullableNumber(form.longitude),
      ratingValue: toNullableNumber(form.ratingValue),
      messagingLinkZalo: form.messagingLinkZalo || null,
      messagingLinkWhatsapp: form.messagingLinkWhatsapp || null,
      messagingLinkTelegram: form.messagingLinkTelegram || null,
      messagingLinkMessenger: form.messagingLinkMessenger || null,
      messagingLinkKakaotalk: form.messagingLinkKakaotalk || null,
      facebookLink: form.facebookLink || null,
      instagramLink: form.instagramLink || null,
      twitterLink: form.twitterLink || null,
      spaAvatar: form.spaAvatar || null,
      serviceIds: form.serviceIds,
      openingHours: buildOpeningHoursPayload(openingHours),
      location: hasLocationValue(location) ? {
        cityId: location.cityId,
        districtId: location.districtId,
        placeId: location.placeId,
        addressLine: location.addressLine || null,
        lat: toNullableNumber(location.lat),
        lng: toNullableNumber(location.lng),
      } : null,
      galleries: normalizeGalleries(galleries),
    };

    const url = selectedId
      ? `${ADMIN_PROXY_BASE}/spas/${selectedId}`
      : `${ADMIN_PROXY_BASE}/spas`;

    const response = await fetch(url, {
      method: selectedId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Save spa failed: ${response.status}`);
    }

    const saved = normalizeResponse<SpaDetail>(await response.json());
    setSelectedId(saved.id);
    resetEditor(saved);
    setStatus(`Saved spa: ${saved.slug}`);
    await loadList(activeQuery, meta.page);
  }

  async function remove() {
    if (!selectedId) return;
    if (!window.confirm('Delete this spa and its deals?')) return;

    const response = await fetch(`${ADMIN_PROXY_BASE}/spas/${selectedId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Delete spa failed: ${response.status}`);

    setSelectedId(null);
    resetEditor(null);
    setStatus('Spa deleted');
    await loadList(activeQuery, 1);
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-[#e7dfcf] bg-white p-5 shadow-[0_18px_50px_-42px_rgba(24,38,29,0.55)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#6d756a]">Supply inventory</p>
              <h3 className="text-xl font-semibold text-[#17241c]">Spas</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedId(null);
                resetEditor(null);
                setStatus('Creating a new spa');
                setError('');
              }}
            >
              New
            </Button>
          </div>

          <div className="mt-4 flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(event) => onEnterSearch(event, () => {
                setActiveQuery(query.trim());
                void loadList(query.trim(), 1).catch((err) => setError(err instanceof Error ? err.message : 'Cannot search'));
              })}
              placeholder="Search spa name, slug, phone"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActiveQuery(query.trim());
                void loadList(query.trim(), 1).catch((err) => setError(err instanceof Error ? err.message : 'Cannot search'));
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
                onClick={() => selectItem(item.id).catch((err) => setError(err instanceof Error ? err.message : 'Cannot load spa'))}
                className={`w-full rounded-[20px] border px-4 py-3 text-left transition ${selectedId === item.id ? 'border-[#31513f] bg-[#eef5ef]' : 'border-[#ece5d8] bg-[#fbfaf7]'
                  }`}
              >
                <p className="font-medium text-[#16231b]">{item.name}</p>
                <p className="mt-1 text-xs text-[#6d756a]">{item.slug}</p>
                <p className="mt-1 text-xs text-[#6d756a]">
                  {[item.cityName, item.districtName].filter(Boolean).join(' · ') || 'No location'}
                </p>
              </button>
            ))}
            {!items.length && (
              <div className="rounded-[20px] border border-dashed border-[#e7dfcf] px-4 py-6 text-sm text-[#6d756a]">
                {isPending ? 'Loading spas...' : 'No spas found.'}
              </div>
            )}
          </div>

          <AdminPager
            meta={meta}
            onPageChange={(page) => {
              void loadList(activeQuery, page).catch((err) => setError(err instanceof Error ? err.message : 'Cannot change page'));
            }}
          />
        </section>

        <section className="rounded-[28px] border border-[#e7dfcf] bg-white p-6 shadow-[0_18px_50px_-42px_rgba(24,38,29,0.55)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#6d756a]">Editor</p>
              <h3 className="text-xl font-semibold text-[#17241c]">{selectedId ? 'Edit spa' : 'Create spa'}</h3>
            </div>
            <div className="flex gap-2">
              {selectedId && (
                <Button type="button" variant="outline" onClick={() => remove().catch((err) => setError(err instanceof Error ? err.message : 'Cannot delete spa'))}>
                  Delete
                </Button>
              )}
              <Button type="button" onClick={() => save().catch((err) => setError(err instanceof Error ? err.message : 'Cannot save spa'))}>
                Save
              </Button>
            </div>
          </div>

          {status && <p className="mt-4 rounded-[16px] bg-[#eef6ef] px-4 py-3 text-sm text-[#2e5a42]">{status}</p>}
          {error && <p className="mt-4 rounded-[16px] bg-[#fff1ee] px-4 py-3 text-sm text-[#9a3d2f]">{error}</p>}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Name" />
            <Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="Phone" />
            <Input value={form.website} onChange={(e) => updateField('website', e.target.value)} placeholder="Website" />
            <Input value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Address" />
            <Input value={form.province} onChange={(e) => updateField('province', e.target.value)} placeholder="Province" />
            <Input value={form.googlePlaceId} onChange={(e) => updateField('googlePlaceId', e.target.value)} placeholder="Google Place ID" />
            <Input value={form.googleMapsUri} onChange={(e) => updateField('googleMapsUri', e.target.value)} placeholder="Google Maps URI" />
            <Input value={form.latitude} onChange={(e) => updateField('latitude', e.target.value)} placeholder="Latitude" />
            <Input value={form.longitude} onChange={(e) => updateField('longitude', e.target.value)} placeholder="Longitude" />
            <Input value={form.ratingValue} onChange={(e) => updateField('ratingValue', e.target.value)} placeholder="Rating value" />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FieldCard title="Spa services">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-[#6d756a]">{form.services.length ? `${form.services.length} selected` : 'No service selected yet.'}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setServiceDialogOpen(true);
                    setServicePage(1);
                  }}
                >
                  Choose
                </Button>
              </div>
              <div className="mt-4 flex min-h-[64px] flex-wrap content-start gap-2">
                {form.services.length ? form.services.map((service) => (
                  <Badge key={service.id} variant="secondary" appearance="light" className="gap-2 rounded-full">
                    {service.nameVi}
                    <button type="button" onClick={() => toggleService(service)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )) : (
                  <p className="text-sm text-[#6d756a]">No service tags selected.</p>
                )}
              </div>
            </FieldCard>

            <FieldCard title="Avatar">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleAvatarUpload(e)}
                />
                <Button type="button" variant="outline" size="sm" disabled={isUploadingAvatar} onClick={() => avatarInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  {isUploadingAvatar ? 'Uploading...' : 'Upload avatar'}
                </Button>
                {form.spaAvatar && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateField('spaAvatar', '');
                      setAvatarPreviewUrl('');
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {avatarPreviewUrl || form.spaAvatar ? (
                <div className="mt-4 overflow-hidden rounded-[18px] border border-[#e7dfcf] bg-white">
                  <img
                    src={resolveAdminImageSrc(avatarPreviewUrl || form.spaAvatar)}
                    alt={form.name || 'Spa avatar preview'}
                    className="h-48 w-full object-cover"
                  />
                </div>
              ) : (
                <div className="mt-4 flex min-h-[192px] items-center rounded-[18px] border border-dashed border-[#d9d3c6] px-4 py-8 text-sm text-[#6d756a]">
                  No avatar uploaded yet.
                </div>
              )}
            </FieldCard>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <FieldCard title="Opening hours" description="Times use 24-hour format so opening and closing hours stay unambiguous.">
              <div className="space-y-3">
                {openingHours.map((row) => (
                  <div key={row.day} className="rounded-[18px] border border-[#e9e1d4] bg-white p-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <Checkbox
                        checked={row.enabled}
                        onCheckedChange={(checked) => updateOpeningHour(row.day, { enabled: Boolean(checked) })}
                        id={`opening-day-${row.day}`}
                        className="mt-0.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <label htmlFor={`opening-day-${row.day}`} className="block text-base font-semibold text-[#17241c]">
                          {dayLabels[row.day]}
                        </label>
                        <p className="mt-1 text-sm text-[#6d756a]">{row.enabled ? 'Open' : 'Closed'}</p>
                        <p className="text-sm font-medium tabular-nums text-[#445248]">
                          {row.enabled ? `${row.openTime} - ${row.closeTime}` : 'Closed all day'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="grid min-w-0 gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7453]">
                        Open
                        <Input
                          value={row.openTime}
                          disabled={!row.enabled}
                          inputMode="numeric"
                          pattern="[0-2][0-9]:[0-5][0-9]"
                          placeholder="09:00"
                          className="h-11 min-w-0 rounded-[14px] px-3 text-sm font-medium tabular-nums tracking-normal"
                          onChange={(e) => updateOpeningHour(row.day, { openTime: e.target.value })}
                        />
                      </label>
                      <label className="grid min-w-0 gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7453]">
                        Close
                        <Input
                          value={row.closeTime}
                          disabled={!row.enabled}
                          inputMode="numeric"
                          pattern="[0-2][0-9]:[0-5][0-9]"
                          placeholder="22:00"
                          className="h-11 min-w-0 rounded-[14px] px-3 text-sm font-medium tabular-nums tracking-normal"
                          onChange={(e) => updateOpeningHour(row.day, { closeTime: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </FieldCard>

            <FieldCard title="Place">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[18px] border border-[#e9e1d4] bg-white p-3">
                    <p className="text-xs text-[#6d756a]">City</p>
                    <p className="mt-1 text-sm font-medium text-[#17241c]">{location.cityName || 'Not selected'}</p>
                    <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={() => {
                      setCityPage(1);
                      setCityDialogOpen(true);
                    }}>
                      Choose city
                    </Button>
                  </div>
                  <div className="rounded-[18px] border border-[#e9e1d4] bg-white p-3">
                    <p className="text-xs text-[#6d756a]">District</p>
                    <p className="mt-1 text-sm font-medium text-[#17241c]">{location.districtName || 'Not selected'}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      disabled={!location.citySlug}
                      onClick={() => {
                        setDistrictPage(1);
                        setDistrictDialogOpen(true);
                      }}
                    >
                      Choose district
                    </Button>
                  </div>
                  <div className="rounded-[18px] border border-[#e9e1d4] bg-white p-3">
                    <p className="text-xs text-[#6d756a]">Place</p>
                    <p className="mt-1 text-sm font-medium text-[#17241c]">{location.placeName || 'Not selected'}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      disabled={!location.districtSlug}
                      onClick={() => {
                        setPlacePage(1);
                        setPlaceDialogOpen(true);
                      }}
                    >
                      Choose place
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    value={location.addressLine}
                    onChange={(e) => updateLocationField('addressLine', e.target.value)}
                    placeholder="Address line"
                  />
                  <Input
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Display address"
                  />
                  <Input
                    value={location.lat}
                    onChange={(e) => updateLocationField('lat', e.target.value)}
                    placeholder="Location lat"
                  />
                  <Input
                    value={location.lng}
                    onChange={(e) => updateLocationField('lng', e.target.value)}
                    placeholder="Location lng"
                  />
                </div>
              </div>
            </FieldCard>
          </div>

          <div className="mt-4">
            <FieldCard title="Gallery">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void handleGalleryUpload(e)}
                />
                <Button type="button" variant="outline" disabled={isUploadingGallery} onClick={() => uploadInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  {isUploadingGallery ? 'Uploading...' : 'Upload images'}
                </Button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {galleries.map((item, index) => (
                  <div key={`${item.imageUrl}-${index}`} className="overflow-hidden rounded-[20px] border border-[#e9e1d4] bg-white">
                    <div className="aspect-[4/3] bg-[#f4efe5]">
                      <img src={resolveAdminImageSrc(item.previewUrl || item.imageUrl)} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" />
                    </div>
                    <div className="space-y-3 p-3">
                      <p className="line-clamp-2 text-xs text-[#6d756a]">{item.imageUrl}</p>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" disabled={index === 0} onClick={() => moveGallery(index, -1)}>
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="sm" disabled={index === galleries.length - 1} onClick={() => moveGallery(index, 1)}>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => removeGallery(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {!galleries.length && (
                  <div className="rounded-[20px] border border-dashed border-[#e7dfcf] px-4 py-8 text-sm text-[#6d756a]">
                    No gallery image yet.
                  </div>
                )}
              </div>
            </FieldCard>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Input value={form.messagingLinkZalo} onChange={(e) => updateField('messagingLinkZalo', e.target.value)} placeholder="Zalo link" />
            <Input value={form.messagingLinkWhatsapp} onChange={(e) => updateField('messagingLinkWhatsapp', e.target.value)} placeholder="WhatsApp link" />
            <Input value={form.messagingLinkTelegram} onChange={(e) => updateField('messagingLinkTelegram', e.target.value)} placeholder="Telegram link" />
            <Input value={form.messagingLinkMessenger} onChange={(e) => updateField('messagingLinkMessenger', e.target.value)} placeholder="Messenger link" />
            <Input value={form.messagingLinkKakaotalk} onChange={(e) => updateField('messagingLinkKakaotalk', e.target.value)} placeholder="KakaoTalk link" />
            <Input value={form.facebookLink} onChange={(e) => updateField('facebookLink', e.target.value)} placeholder="Facebook link" />
            <Input value={form.instagramLink} onChange={(e) => updateField('instagramLink', e.target.value)} placeholder="Instagram link" />
            <Input value={form.twitterLink} onChange={(e) => updateField('twitterLink', e.target.value)} placeholder="Twitter link" />
          </div>
        </section>
      </div>

      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select spa services</DialogTitle>
            <DialogDescription>Search the admin service catalog and attach canonical services to this spa.</DialogDescription>
          </DialogHeader>
          <DialogBody>

            <div className="flex gap-2">
              <Input
                value={serviceQuery}
                onChange={(e) => setServiceQuery(e.target.value)}
                onKeyDown={(event) => onEnterSearch(event, () => {
                  setServicePage(1);
                  void loadServices(serviceQuery, 1).catch((err) => setError(err instanceof Error ? err.message : 'Cannot search services'));
                })}
                placeholder="Search service name, slug, code"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setServicePage(1);
                  void loadServices(serviceQuery, 1).catch((err) => setError(err instanceof Error ? err.message : 'Cannot search services'));
                }}
              >
                Search
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {serviceItems.map((service) => {
                const checked = form.serviceIds.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left ${checked ? 'border-[#31513f] bg-[#eef5ef]' : 'border-[#ece5d8] bg-white'
                      }`}
                  >
                    <div>
                      <p className="font-medium text-[#17241c]">{service.nameVi}</p>
                      <p className="text-xs text-[#6d756a]">{service.slugGlobal} · {service.code}</p>
                    </div>
                    <span className="text-sm font-medium text-[#31513f]">{checked ? 'Selected' : 'Add'}</span>
                  </button>
                );
              })}
              {!serviceItems.length && (
                <div className="rounded-[18px] border border-dashed border-[#e7dfcf] px-4 py-6 text-sm text-[#6d756a]">
                  No services found.
                </div>
              )}
            </div>

            <AdminPager
              meta={serviceMeta}
              onPageChange={(page) => {
                setServicePage(page);
                void loadServices(serviceQuery, page).catch((err) => setError(err instanceof Error ? err.message : 'Cannot change page'));
              }}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select city</DialogTitle>
            <DialogDescription>Choose a city from the location dataset.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-2">
              {cityItems.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => chooseCity(city)}
                  className={`flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left ${location.cityId === city.id ? 'border-[#31513f] bg-[#eef5ef]' : 'border-[#ece5d8] bg-white'
                    }`}
                >
                  <div>
                    <p className="font-medium text-[#17241c]">{city.nameVi}</p>
                    <p className="text-xs text-[#6d756a]">{city.slug}</p>
                  </div>
                  <span className="text-sm font-medium text-[#31513f]">{location.cityId === city.id ? 'Selected' : 'Choose'}</span>
                </button>
              ))}
              {!cityItems.length && (
                <div className="rounded-[18px] border border-dashed border-[#e7dfcf] px-4 py-6 text-sm text-[#6d756a]">
                  No cities found.
                </div>
              )}
            </div>

            <AdminPager
              meta={cityMeta}
              onPageChange={(page) => {
                setCityPage(page);
                void loadCities(page).catch((err) => setError(err instanceof Error ? err.message : 'Cannot change page'));
              }}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={districtDialogOpen} onOpenChange={setDistrictDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select district</DialogTitle>
            <DialogDescription>Choose a district within the selected city.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-2">
              {districtItems.map((district) => (
                <button
                  key={district.id}
                  type="button"
                  onClick={() => chooseDistrict(district)}
                  className={`flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left ${location.districtId === district.id ? 'border-[#31513f] bg-[#eef5ef]' : 'border-[#ece5d8] bg-white'
                    }`}
                >
                  <div>
                    <p className="font-medium text-[#17241c]">{district.nameVi}</p>
                    <p className="text-xs text-[#6d756a]">{district.slug}</p>
                  </div>
                  <span className="text-sm font-medium text-[#31513f]">{location.districtId === district.id ? 'Selected' : 'Choose'}</span>
                </button>
              ))}
              {!districtItems.length && (
                <div className="rounded-[18px] border border-dashed border-[#e7dfcf] px-4 py-6 text-sm text-[#6d756a]">
                  {location.citySlug ? 'No districts found.' : 'Select a city first.'}
                </div>
              )}
            </div>

            <AdminPager
              meta={districtMeta}
              onPageChange={(page) => {
                setDistrictPage(page);
                void loadDistricts(page).catch((err) => setError(err instanceof Error ? err.message : 'Cannot change page'));
              }}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={placeDialogOpen} onOpenChange={setPlaceDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select place</DialogTitle>
            <DialogDescription>Search places under the selected district. Results are paginated.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex gap-2">
              <Input
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                onKeyDown={(event) => onEnterSearch(event, () => {
                  setPlacePage(1);
                  void loadPlaces(placeQuery, 1).catch((err) => setError(err instanceof Error ? err.message : 'Cannot search places'));
                })}
                placeholder="Search place name or slug"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPlacePage(1);
                  void loadPlaces(placeQuery, 1).catch((err) => setError(err instanceof Error ? err.message : 'Cannot search places'));
                }}
              >
                Search
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {placeItems.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => choosePlace(place)}
                  className={`flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left ${location.placeId === place.id ? 'border-[#31513f] bg-[#eef5ef]' : 'border-[#ece5d8] bg-white'
                    }`}
                >
                  <div>
                    <p className="font-medium text-[#17241c]">{place.nameVi}</p>
                    <p className="text-xs text-[#6d756a]">{place.slug}</p>
                  </div>
                  <span className="text-sm font-medium text-[#31513f]">{location.placeId === place.id ? 'Selected' : 'Choose'}</span>
                </button>
              ))}
              {!placeItems.length && (
                <div className="rounded-[18px] border border-dashed border-[#e7dfcf] px-4 py-6 text-sm text-[#6d756a]">
                  {location.districtSlug ? 'No places found.' : 'Select a district first.'}
                </div>
              )}
            </div>

            <AdminPager
              meta={placeMeta}
              onPageChange={(page) => {
                setPlacePage(page);
                void loadPlaces(placeQuery, page).catch((err) => setError(err instanceof Error ? err.message : 'Cannot change page'));
              }}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
