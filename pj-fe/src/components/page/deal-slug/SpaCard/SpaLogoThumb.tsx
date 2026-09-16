"use client";

import Image from "next/image";
import { useState } from "react";
import { shouldBypassNextImageOptimization } from "@/libs/spa-image-url";

const FALLBACK_SPA_LOGO = "/assets/images/common/logo_x.png";

function getRenderableImageSrc(src: string | null | undefined) {
  return src && /^(https?:\/\/|\/)/.test(src) ? src : null;
}

interface SpaLogoThumbProps {
  logoUrl?: string | null;
  photoName?: string | null;
  name: string;
}

/**
 * Client component — dùng useState để fallback về logo Nhom36 khi ảnh lỗi.
 * Tách ra vì SpaCard là async RSC, không dùng useState trực tiếp được.
 */
export function SpaLogoThumb({ logoUrl, photoName, name }: SpaLogoThumbProps) {
  const [errored, setErrored] = useState(false);

  const src = !errored
    ? (getRenderableImageSrc(logoUrl) ?? getRenderableImageSrc(photoName))
    : null;

  if (src) {
    return (
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-brand-100">
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="64px"
          unoptimized={shouldBypassNextImageOptimization(src)}
          onError={() => setErrored(true)}
        />
      </div>
    );
  }

  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white border border-[#f0f0f0]">
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <div className="relative w-full h-full">
          <Image
            src={FALLBACK_SPA_LOGO}
            alt={name}
            fill
            className="object-contain"
            sizes="64px"
          />
        </div>
      </div>
    </div>
  );
}
