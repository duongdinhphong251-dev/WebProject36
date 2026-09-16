"use client";

import type {
  MenuButtonProps,
  MenuItem,
  ResponsiveMenuProps,
} from "@/types/menu";

import { usePathname } from "next/navigation";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useHeader } from "@/contexts/header";
import MenuButton from "./MenuButton";
import MenuItemRenderer from "./MenuItemRenderer";
import OverflowButton from "./OverflowButton";

const ResponsiveMenu: React.FC<ResponsiveMenuProps> = ({
  overflowButtonWidth = 60,
}) => {
  const MAX_PRIMARY_ITEMS = 10;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const { mainMenu } = useHeader();
  const [visibleItems, setVisibleItems] = useState<number>(
    mainMenu?.length || 0,
  );
  const pathname = usePathname();

  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef.current) {
        return;
      }
      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      const containerLeft = container.getBoundingClientRect().left;
      const containerRight = containerLeft + containerWidth;

      let newVisibleItems = Math.min(mainMenu.length, MAX_PRIMARY_ITEMS);

      for (let i = 0; i < menuItemsRef.current.length; i++) {
        const item = menuItemsRef.current[i];
        if (!item) {
          continue;
        }

        if (i >= MAX_PRIMARY_ITEMS) {
          newVisibleItems = MAX_PRIMARY_ITEMS;
          break;
        }

        const itemRect = item.getBoundingClientRect();
        const itemRight = itemRect.right;

        if (itemRight > containerRight - overflowButtonWidth) {
          newVisibleItems = i;
          break;
        }
      }

      if (newVisibleItems >= Math.min(mainMenu.length, MAX_PRIMARY_ITEMS)) {
        setVisibleItems(Math.min(mainMenu.length, MAX_PRIMARY_ITEMS));
      } else {
        setVisibleItems(Math.max(0, newVisibleItems));
      }
    };

    const timer = setTimeout(updateWidth, 100);
    window.addEventListener("resize", updateWidth);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateWidth);
    };
  }, [mainMenu.length, overflowButtonWidth]);

  const isPathActive = (href: string): boolean => {
    if (pathname === href || pathname?.startsWith(href)) {
      return true;
    }

    return false;
  };

  const isMenuActive = (item: MenuItem): boolean => {
    if (item.href && isPathActive(item.href)) {
      return true;
    }
    if (item.subMenus) {
      return item.subMenus.some((sub) => sub.href && isPathActive(sub.href));
    }
    return false;
  };

  const renderButton = (props: MenuButtonProps) => <MenuButton {...props} />;

  const visibleMenuItems = mainMenu.slice(0, visibleItems);
  const overflowMenuItems = mainMenu.slice(visibleItems);
  return (
    <div className="relative hidden flex-1 md:flex">
      <div
        ref={containerRef}
        id="menu-hidden"
        className="pointer-events-none invisible absolute inset-0 -z-10 flex flex-row whitespace-nowrap opacity-0"
      >
        {mainMenu.map((item: MenuItem, index: number) => (
          <MenuItemRenderer
            key={index}
            item={item}
            index={index}
            isActive={isMenuActive(item)}
            onRenderButton={renderButton}
            onSetRef={(el) => {
              menuItemsRef.current[index] = el;
            }}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-row items-center lg:justify-center">
        {visibleMenuItems.map((item: MenuItem, index: number) => (
          <MenuItemRenderer
            key={index}
            item={item}
            index={index}
            isActive={isMenuActive(item)}
            onRenderButton={renderButton}
          />
        ))}

        {overflowMenuItems.length > 0 && (
          <OverflowButton data={overflowMenuItems} />
        )}
      </div>
    </div>
  );
};

export default ResponsiveMenu;
