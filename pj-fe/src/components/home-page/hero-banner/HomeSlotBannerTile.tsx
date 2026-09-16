"use client";

import { useState } from "react";
import Image from "next/image";
import { shouldBypassNextImageOptimization } from "@/libs/spa-image-url";
import { BannerClickLink } from "@/components/common/banners/BannerClickLink";

interface HomeSlotBannerTileProps {
  href: string;
  imageUrl: string;
  bannerName: string;
  gaClickTag?: string | null;
  index?: number;
  onHide?: () => void;
}

export function HomeSlotBannerTile({
  href,
  imageUrl,
  bannerName,
  gaClickTag,
  index,
  onHide,
}: HomeSlotBannerTileProps) {
  const [hidden, setHidden] = useState(false);
  const unoptimized = shouldBypassNextImageOptimization(imageUrl);

  if (hidden) return null;

  return (
    <BannerClickLink
      href={href}
      className="group block overflow-hidden rounded-[16px] md:rounded-2xl transition-transform duration-300 hover:scale-[1.01] w-full aspect-square"
      gaClickTag={gaClickTag}
      bannerName={bannerName}
      placement="home_slot"
      index={index}
    >
      <div className="relative w-full h-full aspect-square overflow-hidden">
        <Image
          src={imageUrl}
          alt={bannerName || "Banner"}
          fill
          priority={index != null && index <= 4}
          fetchPriority={index != null && index <= 4 ? "high" : "auto"}
          unoptimized={unoptimized}
          sizes="(max-width: 768px) 25vw, 300px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          onError={() => {
            setHidden(true);
            onHide?.();
          }}
        />
      </div>
    </BannerClickLink>
  );
}
