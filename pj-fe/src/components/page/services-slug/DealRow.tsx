'use client';

import type { Deal } from '@/types/deal';
import { FlashSaleCountdown } from '@/components/home-page/flash-sale/FlashSaleCountdown';
import { ChevronRight } from 'lucide-react';

import { TrackedDealLink } from "@/components/tracking/TrackedDealLink";
import { dealTrackingSlug } from "@/libs/deal-slug";
interface DealRowProps {
  deal: Deal;
}

export function DealRow({ deal }: DealRowProps) {
  const discountPercent = Math.round(((deal.originalPrice - deal.discountedPrice) / deal.originalPrice) * 100);

  return (
    <TrackedDealLink
      href={`/organization_services/${deal.id}`}
      dealSlug={dealTrackingSlug(deal)}
      className="relative flex items-end gap-2 rounded-[20px] border border-[#d3d8e0] bg-[#fafafa] p-3 hover:bg-gray-50 transition-colors block w-full"
    >
      <div className="flex-1 min-w-0 space-y-2">
        <p className="line-clamp-2 break-words whitespace-normal text-xs font-medium text-[#0a0d12]">{deal.title}</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <p className="text-base font-semibold text-[#d92d20]">
              {deal.discountedPrice.toLocaleString('vi-VN')}đ
            </p>
            <p className="text-xs line-through text-[#a4a7ae]">
              {deal.originalPrice.toLocaleString('vi-VN')}đ
            </p>
            <div className="rounded-full bg-[#fecdca] px-2 py-0.5">
              <p className="text-[9px] font-semibold text-[#d92d20]">-{discountPercent}%</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#535862]">
          <span>Available time:</span>
          <FlashSaleCountdown targetDate={new Date(deal.expiresAt)} />
        </div>
      </div>
      <button
        className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl border border-[#f5f5f5] bg-white hover:shadow-sm"
        aria-label="View deal"
      >
        <ChevronRight className="h-5 w-5 text-[#414651]" />
      </button>
    </TrackedDealLink>
  );
}
