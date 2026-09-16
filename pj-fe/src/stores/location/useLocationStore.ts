import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { CityResponseDto } from '@/types/api';

export type Coords = {
  latitude: number;
  longitude: number;
};

export type CitySource = 'auto' | 'manual';

type LocationState = {
  coords: Coords | null;
  selectedCity: CityResponseDto | null;
  citySource: CitySource | null;
  /** true sau khi cookie đã được đọc xong */
  isHydrated: boolean;
  setCoords: (coords: Coords) => void;
  clearCoords: () => void;
  setSelectedCity: (city: CityResponseDto | null, source?: CitySource) => void;
  setHydrated: () => void;
};

export const LOCATION_COOKIE_NAME = 'tuoi-location';

const cookieStorage = {
  getItem: (name: string) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`));
    if (!match) return null;
    try {
      return decodeURIComponent(match.split('=').slice(1).join('='));
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    if (typeof document === 'undefined') return;
    const maxAge = 1 * 24 * 60 * 60; // 1 ngày
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  },
  removeItem: (name: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; path=/; max-age=0`;
  },
};

export const useLocationStore = create<LocationState>()(
  devtools(
    persist(
      (set) => ({
        coords: null,
        selectedCity: null,
        citySource: null,
        isHydrated: false,
        setCoords: (coords) => set({ coords }),
        clearCoords: () => set({ coords: null }),
        setSelectedCity: (selectedCity, source = 'manual') =>
          set({
            selectedCity,
            citySource: source,
          }),
        setHydrated: () => set({ isHydrated: true }),
      }),
      {
        name: LOCATION_COOKIE_NAME,
        storage: createJSONStorage(() => cookieStorage),
        partialize: (state) => ({
          coords: state.coords,
          selectedCity: state.selectedCity,
          citySource: state.citySource,
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHydrated();
        },
      },
    ),
    { name: 'LocationStore' },
  ),
);

