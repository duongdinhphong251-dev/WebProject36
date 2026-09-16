import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { FilterState, PriceSort } from '@/types/filter';

interface FilterStore {
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  updateGender: (gender: string[]) => void;
  updatePriceSort: (priceSort: PriceSort | undefined) => void;
  updateRating: (minRating: number) => void;
  resetFilters: () => void;
}

const INITIAL_STATE: FilterState = {
  gender: [],
  minRating: 0,
};

export const useFilterStore = create<FilterStore>()(
  devtools(
    (set) => ({
      filters: INITIAL_STATE,

      setFilters: (partial) => set((state) => ({ filters: { ...state.filters, ...partial } })),

      updateGender: (gender) => set((state) => ({
        filters: { ...state.filters, gender },
      })),

      updatePriceSort: (priceSort) => set((state) => ({
        filters: { ...state.filters, priceSort },
      })),

      updateRating: (minRating) => set((state) => ({
        filters: { ...state.filters, minRating },
      })),

      resetFilters: () => set({ filters: INITIAL_STATE }),
    }),
    { name: 'FilterStore' },
  ),
);
