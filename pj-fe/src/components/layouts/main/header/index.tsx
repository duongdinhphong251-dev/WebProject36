"use client";

import type { MenuItem } from "@/types/menu";
import { HeaderProvider, useHeader } from "@/contexts/header";
import MainMenu from "./menu";
import AnimatedHeaderWrapper from "./menu/AnimatedHeaderWrapper";

const HEADER_MENU_PATHS = new Set([
  // vi
  "/massage",
  "/goi-dau-duong-sinh",
  "/cham-soc-da-mat",
  "/nail",
  "/toc-barber",
  // en
  "/nourishing-hair-wash",
  "/skincare",
  "/nail",
  "/hair-barber",
  // ko
  "/masaji",
  "/yeongyang-syampu",
  "/seukinkeeo",
  "/neil-maeni-pedi",
  "/he-eo-babeo",
]);

function HeaderContent() {
  const { setHeaderHeight } = useHeader();

  const onHeightChange = (height: number) => {
    setHeaderHeight(height);
  };

  return (
    <AnimatedHeaderWrapper
      threshold={80}
      animationDuration={250}
      onHeightChange={onHeightChange}
    >
      <MainMenu />
    </AnimatedHeaderWrapper>
  );
}

export default function HeaderMain({ menu }: { menu: MenuItem[] }) {
  const filteredMenu = menu.filter(
    (item) => item.href && HEADER_MENU_PATHS.has(item.href),
  );

  return (
    <HeaderProvider menu={filteredMenu}>
      <HeaderContent />
    </HeaderProvider>
  );
}
