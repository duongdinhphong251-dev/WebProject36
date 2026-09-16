'use client';

import useTranslate from '@/hooks/useTranslate';
import { useFilterStore } from '@/stores/filter/useFilterStore';
import { FilterSection } from './FilterSection';
import type { PriceSort } from '@/types/filter';

const OPTIONS: { key: PriceSort | 'all'; labelKey: string }[] = [
  { key: 'all', labelKey: 'all' },
  { key: 'asc', labelKey: 'price_asc' },
  { key: 'desc', labelKey: 'price_desc' },
];

export function FilterPrice() {
  const t = useTranslate('filter');
  const { filters, updatePriceSort } = useFilterStore();
  const current = filters.priceSort ?? 'all';

  return (
    <FilterSection title={t('price')} defaultOpen={true}>
      <div className="space-y-2 px-4 py-2">
        {OPTIONS.map(({ key, labelKey }) => {
          const isActive = current === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => updatePriceSort(key === 'all' ? undefined : key)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: isActive ? '#E6EBE4' : 'transparent',
                color: isActive ? '#143423' : '#0a0d12',
                fontWeight: isActive ? 500 : 400,
                border: `1.5px solid ${isActive ? '#5B7A4F' : '#e9eaeb'}`,
              }}
            >
              {t(labelKey as Parameters<typeof t>[0])}
            </button>
          );
        })}
      </div>
    </FilterSection>
  );
}
