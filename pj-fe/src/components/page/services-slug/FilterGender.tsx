'use client';

import { useCallback } from 'react';
import useTranslate from '@/hooks/useTranslate';
import { useFilterStore } from '@/stores/filter/useFilterStore';
import { Checkbox } from '@/components/ui/checkbox';
import { FilterSection } from './FilterSection';

const GENDER_OPTIONS: Array<{
  value: string;
  labelKey: string;
  labelDefault: string;
}> = [
  { value: 'male', labelKey: 'male', labelDefault: 'Nam' },
  { value: 'female', labelKey: 'female', labelDefault: 'Nữ' },
  { value: 'other', labelKey: 'other', labelDefault: 'Khác' },
];

/**
 * Gender filter with checkboxes
 * Multi-select checkboxes for Male/Female/Other
 * Syncs selection with URL query string (?gender=male,female)
 */
export function FilterGender() {
  const t = useTranslate('common');
  const { filters, updateGender } = useFilterStore();

  const handleGenderChange = useCallback(
    (value: string, checked: boolean) => {
      const newGenders = checked
        ? [...filters.gender, value]
        : filters.gender.filter((g) => g !== value);
      updateGender(newGenders);
    },
    [filters.gender, updateGender],
  );

  return (
    <FilterSection title={t('gender') || 'Giới tính'} defaultOpen={true}>
      <div className="space-y-2">
        {GENDER_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-gray-50 transition-colors"
          >
            <Checkbox
              checked={filters.gender.includes(option.value)}
              onCheckedChange={(checked) => handleGenderChange(option.value, Boolean(checked))}
              id={`gender-${option.value}`}
            />
            <span className="text-sm text-gray-700">
              {t(option.labelKey) || option.labelDefault}
            </span>
          </label>
        ))}
      </div>
    </FilterSection>
  );
}
