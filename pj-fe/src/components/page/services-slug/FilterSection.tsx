'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/libs/utils';

interface FilterSectionProps {
  title: string;           // e.g., "Địa điểm", "Giới tính", "Giá", "Đánh giá"
  children: ReactNode;
  defaultOpen?: boolean;   // Default expanded state (default: true)
}

/**
 * Collapsible filter section wrapper
 * Provides title, chevron icon, and collapse/expand toggle
 */
export function FilterSection({
  title,
  children,
  defaultOpen = true,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      {/* Header: Title + Chevron */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg hover:bg-gray-50 px-2 py-2 transition-colors"
        aria-expanded={isOpen}
      >
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <ChevronDown
          className={cn(
            'size-5 text-gray-600 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {/* Content: Animated collapse/expand */}
      {isOpen && (
        <div className="mt-3 pl-2">
          {children}
        </div>
      )}
    </div>
  );
}
