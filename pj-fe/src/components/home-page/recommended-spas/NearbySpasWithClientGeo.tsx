"use client";

import { useEffect, useState } from "react";
import type { RecommendedSpaDto } from "@/types/api";
import { NearbySpasScroll } from "./NearbySpasScroll";
import { NearbySpaMobileCard } from "./NearbySpaMobileCard";

export function NearbySpasWithClientGeo({
  initialSpas,
  locale,
}: {
  initialSpas: RecommendedSpaDto[];
  locale: string;
}) {
  const [spas, setSpas] = useState(initialSpas);

  useEffect(() => {
    setSpas(initialSpas);
  }, [initialSpas]);

  const displayedSpas = spas.slice(0, 4);

  if (!displayedSpas.length) return null;
  return (
    <>
      {/* Giao diện Mobile (Dưới 768px): Danh sách tối đa 4 thẻ theo ảnh mẫu */}
      <div className="flex flex-col gap-3 md:hidden">
        {displayedSpas.map((spa) => (
          <NearbySpaMobileCard key={spa.id || spa.slug} spa={spa} locale={locale} />
        ))}
      </div>

      {/* Giao diện Tablet / Desktop (Từ 768px trở lên): Hiển thị tối đa 4 thẻ */}
      <div className="hidden md:block">
        <NearbySpasScroll spas={displayedSpas} locale={locale} />
      </div>
    </>
  );
}

