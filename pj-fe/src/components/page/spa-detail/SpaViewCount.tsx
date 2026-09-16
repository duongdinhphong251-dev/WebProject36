'use client';

import Eye from 'lucide-react/dist/esm/icons/eye';
import { useSpaViewCount } from '@/hooks/useSpaViewCount';

interface SpaViewCountProps {
  slug: string;
  locale: string;
  label: string;
}

export function SpaViewCount({ slug, locale, label }: SpaViewCountProps) {
  const { data: viewCount = 0 } = useSpaViewCount(slug);
  return (
    <div className="flex items-center gap-1">
      <Eye className="size-3.5 shrink-0 text-[#535862]" aria-hidden />
      <span
        suppressHydrationWarning
        className="text-[12px] font-normal leading-[1.4] text-[#535862]"
      >
        {viewCount.toLocaleString(locale)} {label}
      </span>
    </div>
  );
}
