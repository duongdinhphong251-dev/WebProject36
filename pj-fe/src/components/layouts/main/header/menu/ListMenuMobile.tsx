import type { MenuItem } from '@/types/menu';
import { ChevronDown, ChevronUp } from 'lucide-react';
import CustomLink from '@/components/common/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ListMenuMobile({
  menuRender,
  onNavigate,
}: {
  menuRender: MenuItem[];
  onNavigate?: () => void;
}) {
  return (
    <nav className="p-0">
      <ul className="m-0 list-none p-0">
        {menuRender.map((item, idx) => (
          <RecursiveMenu key={idx} item={item} level={0} onNavigate={onNavigate} />
        ))}
      </ul>
    </nav>
  );
}

function RecursiveMenu({
  item,
  level,
  onNavigate,
}: {
  item: MenuItem;
  level: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const subMenus = item.subMenus || [];

  const isSelfActive = !!(
    item.href
    && (pathname === item.href || pathname.startsWith(`${item.href}/`))
  );

  const hasActiveChild = subMenus.some(
    sub =>
      sub.href === pathname || pathname.startsWith(`${sub.href ?? ''}/`),
  );

  const isActive = isSelfActive || hasActiveChild;

  const [open, setOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      const t = setTimeout(() => setOpen(true), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isActive]);

  const handleClick = (e: React.MouseEvent) => {
    if (subMenus.length > 0) {
      e.preventDefault();
      setOpen(!open);
    }
  };

  const button = (
    <div
      role="button"
      onClick={handleClick}
      className={`flex w-full items-center justify-between py-2 pr-2 ${isActive ? 'text-primary bg-primary/5 font-bold' : 'text-foreground bg-transparent font-normal'
        }`}
      style={{ paddingLeft: `${16 + level * 16}px` }}
    >
      <span className="m-0">{item.label}</span>
      {subMenus.length > 0
        ? (
          open
            ? (
              <ChevronUp className="h-5 w-5" />
            )
            : (
              <ChevronDown className="h-5 w-5" />
            )
        )
        : null}
    </div>
  );

  return (
    <li className="w-full list-none">
      {item.href && subMenus.length === 0
        ? (
          <CustomLink
            href={item.href}
            className="block no-underline"
            onClick={() => onNavigate?.()}
          >
            {button}
          </CustomLink>
        )
        : (
          button
        )}

      {subMenus.length > 0 && open && (
        <div className="w-full">
          {subMenus.length > 10
            ? (
              <div className="flex w-full flex-row flex-wrap gap-0">
                {subMenus.map((sub, idx) => (
                  <div className="w-[50%]" key={idx}>
                    <RecursiveMenu item={sub} level={level + 1} onNavigate={onNavigate} />
                  </div>
                ))}
              </div>
            )
            : (
              <ul className="m-0 w-full list-none p-0">
                {subMenus.map((sub, idx) => (
                  <RecursiveMenu
                    key={idx}
                    item={sub}
                    level={level + 1}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            )}
        </div>
      )}
    </li>
  );
}
