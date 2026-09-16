"use client";

import type { RecommendedSpaDto } from "@/types/api";
import { NearbySpaCard } from "./NearbySpaCard";

interface NearbySpasScrollProps {
  spas: RecommendedSpaDto[];
  locale?: string;
}

export function NearbySpasScroll({
  spas,
  locale,
}: NearbySpasScrollProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {spas.map((spa) => (
        <div key={spa.id || spa.slug} className="w-full h-full flex">
          <NearbySpaCard spa={spa} locale={locale} />
        </div>
      ))}
    </div>
  );
}
