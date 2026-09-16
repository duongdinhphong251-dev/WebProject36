'use client';

import type { MenuButtonProps, MenuItem } from '@/types/menu';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useCallback, useRef, useState } from 'react';
import CustomLink from '@/components/common/link';
import { Button } from '@/components/ui/button';
import MenuItemRenderer from './MenuItemRenderer';

const MenuButton: React.FC<MenuButtonProps> = ({ label, href, target, hasSubMenu, isActive, subMenus }) => {
  const [open, setOpen] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  const handleMouseEnter = () => {
    if (hasSubMenu) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (hasSubMenu) {
      timeoutRef.current = setTimeout(() => {
        setOpen(false);
      }, 150);
    }
  };

  const isActiveBtn = isActive || open;

  const isMenuActive = useCallback(
    (item: MenuItem): boolean => {
      const isPathActive = (href: string) => {
        if (!pathname) return false;
        if (pathname === href) return true;
        if (href !== "/") {
          if (pathname.endsWith(href)) return true;
          if (pathname.includes(`${href}/`)) return true;
        } else {
          if (/^\/[a-z]{2}$/i.test(pathname)) return true;
        }
        return false;
      };
      if (item.href && isPathActive(item.href)) {
        return true;
      }
      if (item.subMenus) {
        return item.subMenus.some(sub => sub.href && isPathActive(sub.href));
      }
      return false;
    },
    [pathname],
  );

  const renderButton = useCallback(
    (props: MenuButtonProps) => <MenuButton {...props} />,
    [],
  );

  const renderSubMenu = useCallback((items: MenuItem[]) => {
    if (items.length > 10) {
      return (
        <div className="max-h-[600px] max-w-[500px] overflow-y-auto">
          <div className="flex flex-row flex-wrap gap-0">
            {items.map((item, index) => (
              <div className="w-[33.33%] p-2" key={index}>
                <MenuItemRenderer
                  item={item}
                  index={index}
                  isActive={isMenuActive(item)}
                  onRenderButton={renderButton}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex w-[250px] flex-col gap-1">
        {items.map((item, index) => (
          <MenuItemRenderer
            key={index}
            item={item}
            index={index}
            isActive={isMenuActive(item)}
            onRenderButton={renderButton}
          />
        ))}
      </div>
    );
  }, [isMenuActive, renderButton]);

  return (
    <div
      className="relative flex-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Button
        variant="ghost"
        className={`flex-none h-10 bg-transparent px-3 text-[15px] font-semibold no-underline hover:bg-transparent transition-colors ${isActiveBtn ? 'text-white' : 'text-white/80 hover:text-white'
          }`}
        asChild={!!href}
      >
        {href
          ? (
            <CustomLink href={href!} target={target}>
              <span className="relative">
                {label}
                {isActiveBtn && (
                  <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-white rounded-full" />
                )}
              </span>
              {hasSubMenu && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`ml-1 transition-transform duration-300 ${isActiveBtn ? 'text-white rotate-180' : 'text-white/80 rotate-0'
                    }`}
                >
                  <path d="M6.35147 8.75137C6.8201 8.28275 7.5799 8.28275 8.04853 8.75137L12 12.7028L15.9515 8.75137C16.4201 8.28275 17.1799 8.28275 17.6485 8.75137C18.1172 9.22 18.1172 9.9798 17.6485 10.4484L12.8485 15.2484C12.3799 15.7171 11.6201 15.7171 11.1515 15.2484L6.35147 10.4484C5.88284 9.9798 5.88284 9.22 6.35147 8.75137Z" />
                </svg>
              )}
            </CustomLink>
          )
          : (
            <div className="flex w-full cursor-pointer items-center justify-start">
              <span className="relative w-full text-left">
                {label}
                {isActiveBtn && (
                  <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-white rounded-full" />
                )}
              </span>
              {hasSubMenu && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`ml-1 transition-transform duration-300 ${isActiveBtn ? 'text-white rotate-180' : 'text-white/80 rotate-0'
                    }`}
                >
                  <path d="M6.35147 8.75137C6.8201 8.28275 7.5799 8.28275 8.04853 8.75137L12 12.7028L15.9515 8.75137C16.4201 8.28275 17.1799 8.28275 17.6485 8.75137C18.1172 9.22 18.1172 9.9798 17.6485 10.4484L12.8485 15.2484C12.3799 15.7171 11.6201 15.7171 11.1515 15.2484L6.35147 10.4484C5.88284 9.9798 5.88284 9.22 6.35147 8.75137Z" />
                </svg>
              )}
            </div>
          )}
      </Button>

      {hasSubMenu && subMenus && open && (
        <div className="bg-background pointer-events-auto absolute top-full left-0 z-[1050] mt-2 min-w-[250px] rounded-md p-4 shadow-[0px_4px_12px_rgba(0,0,0,0.1)]">
          {renderSubMenu(subMenus)}
        </div>
      )}
    </div>
  );
};

export default MenuButton;
