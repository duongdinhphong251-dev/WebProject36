export interface MenuItem {
  label: string;
  href?: string;
  abbrev?: string;
  subMenus?: MenuItem[];
  subMenu?: MenuItem[];
}

export interface ResponsiveMenuProps {
  overflowButtonWidth?: number;
}

export interface MenuButtonProps {
  label: string;
  href?: string;
  target?: string;
  hasSubMenu?: boolean;
  isActive?: boolean;
  subMenus?: MenuItem[];
  isMenuActive?: (item: MenuItem) => boolean;
}

export interface MenuItemRendererProps {
  item: MenuItem;
  index: number;
  isInHiddenContainer?: boolean;
  isActive: boolean;
  onRenderButton: (props: MenuButtonProps) => React.ReactNode;
  onSetRef?: (el: HTMLDivElement | null) => void;
}
