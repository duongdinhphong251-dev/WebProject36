"use client";

import { useEffect, useState } from "react";
import type { RecommendedSpaDto } from "@/types/api";
import { RecommendedSpaScroll } from "./RecommendedSpaScroll";

export function RecommendedSpasWithClientGeo({
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

  if (!spas.length) return null;
  return <RecommendedSpaScroll spas={spas} locale={locale} />;
}
