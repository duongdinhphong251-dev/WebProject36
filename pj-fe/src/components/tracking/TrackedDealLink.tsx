"use client";

import type { ReactNode } from "react";

import CustomLink from "@/components/common/link";
import { postRecordClick } from "@/services/api/tracking";
import { trackDealClick } from "@/libs/gtm";

export function TrackedDealLink({
  href,
  className,
  dealSlug,
  style,
  children,
}: {
  href: string;
  className?: string;
  /** Canonical slug deal (raw, không encode) — gửi tracking click */
  dealSlug: string;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <CustomLink
      href={href}
      className={className}
      style={style}
      onClick={() => {
        if (dealSlug) {
          void postRecordClick(dealSlug, "deal");
          trackDealClick(dealSlug);
        }
      }}
    >
      {children}
    </CustomLink>
  );
}
