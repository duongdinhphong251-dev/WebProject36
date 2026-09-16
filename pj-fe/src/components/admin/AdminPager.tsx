'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PaginationMeta } from './admin-auth';

export function AdminPager({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const canGoPrev = meta.page > 1;
  const canGoNext = meta.page < Math.max(meta.totalPages, 1);

  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-[18px] border border-[#ece5d8] bg-[#fbfaf7] px-3 py-2 text-sm text-[#5d675d]">
      <p>
        Page {meta.page}/{Math.max(meta.totalPages, 1)} · {meta.total} items
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!canGoPrev} onClick={() => onPageChange(meta.page - 1)}>
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={!canGoNext} onClick={() => onPageChange(meta.page + 1)}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
