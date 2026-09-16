'use client';

import { useCallback, useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import useTranslate from '@/hooks/useTranslate';
import { useFilterStore } from '@/stores/filter/useFilterStore';
import { Slider } from '@/components/ui/slider';
import { FilterSection } from './FilterSection';

const MIN_RATING = 0;
const MAX_RATING = 5;
const STEP = 0.5;

const QUICK_SELECT_OPTIONS = [
  { label: 'All', value: 0, stars: 0 },
  { label: '2+', value: 2, stars: 2 },
  { label: '3+', value: 3, stars: 3 },
  { label: '4+', value: 4, stars: 4 },
  { label: '5', value: 5, stars: 5 },
];

/**
 * Rating filter with dual quick-select buttons and slider
 * Syncs selection with URL query string (?minRating=3.5)
 */
export function FilterRating() {
  const t = useTranslate('common');
  const { filters, updateRating } = useFilterStore();
  const [localRating, setLocalRating] = useState(filters.minRating);

  // Update local state when filters change from URL
  useEffect(() => {
    setLocalRating(filters.minRating);
  }, [filters.minRating]);

  const handleRatingChange = useCallback(
    (values: number[]) => {
      if (values.length > 0) {
        const newRating = values[0];
        if (newRating !== undefined) {
          setLocalRating(newRating);
          // Validate and update store
          if (newRating >= MIN_RATING && newRating <= MAX_RATING) {
            updateRating(newRating);
          }
        }
      }
    },
    [updateRating],
  );

  const handleQuickSelect = useCallback(
    (value: number) => {
      setLocalRating(value);
      updateRating(value);
    },
    [updateRating],
  );

  const renderStars = (count: number) => {
    if (count === 0) return null;
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: Math.floor(count) }).map((_, i) => (
          <Star
            key={i}
            className="size-3 fill-yellow-400 text-yellow-400"
            aria-hidden="true"
          />
        ))}
        {count % 1 !== 0 && (
          <Star
            className="size-3 fill-yellow-400 text-yellow-400"
            style={{ clipPath: 'inset(0 50% 0 0)' }}
            aria-hidden="true"
          />
        )}
      </div>
    );
  };

  return (
    <FilterSection title={t('rating') || 'Đánh giá'} defaultOpen={true}>
      <div className="space-y-4 px-4 py-2">
        {/* Quick Select Buttons */}
        <div className="flex flex-wrap gap-2">
          {QUICK_SELECT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleQuickSelect(option.value)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                localRating === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Rating Display */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700">
            {localRating === 0
              ? 'Any'
              : `${localRating.toFixed(1)} stars & up`}
          </span>
          {renderStars(localRating)}
        </div>

        {/* Rating Slider */}
        <Slider
          min={MIN_RATING}
          max={MAX_RATING}
          step={STEP}
          value={[localRating]}
          onValueChange={handleRatingChange}
          className="w-full"
        />

        {/* Helper Text */}
        <p className="text-xs text-gray-500 text-center">
          {t('select_minimum_rating') || 'Chọn đánh giá tối thiểu'}
        </p>
      </div>
    </FilterSection>
  );
}
