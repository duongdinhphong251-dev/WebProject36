"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function ConditionalFooter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHidden =
    pathname.includes("/provider/") ||
    pathname.includes("/organization_services/");

  if (isHidden) {
    return null;
  }

  return <>{children}</>;
}
