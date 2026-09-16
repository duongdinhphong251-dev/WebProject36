import type { MenuItemRendererProps } from '@/types/menu';

import { useState } from 'react';
import { checkIsFullDomain } from '@/helpers/strHelper';

const MenuItemRenderer: React.FC<MenuItemRendererProps> = ({
  item,
  isActive,
  onRenderButton,
  onSetRef,
}) => {
  const [hover, setHover] = useState(false);

  const isActiveOrHover = isActive || hover;
  return (
    <div
      ref={onSetRef}
      className="menu-item-render flex flex-none"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {onRenderButton({
        label: item.label,
        href: item.href,
        isActive: isActiveOrHover,
        hasSubMenu: !!item.subMenus,
        subMenus: item.subMenus,
        target: item.href && checkIsFullDomain(item.href) ? '_blank' : undefined,
      })}
    </div>
  );
};

export default MenuItemRenderer;
