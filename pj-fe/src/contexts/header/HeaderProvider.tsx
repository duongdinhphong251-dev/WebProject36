import type { ReactNode } from 'react';
import type { MenuItem } from '@/types/menu';
import { useMemo, useState } from 'react';
import { HeaderContext } from './HeaderContext';

export const HeaderProvider = ({ children, menu }: { children: ReactNode; menu: MenuItem[] }) => {
  const [headerHeight, setHeaderHeight] = useState(0);

  const value = useMemo(
    () => ({ headerHeight, setHeaderHeight, mainMenu: menu }),
    [headerHeight, menu],
  );

  return (
    <HeaderContext value={value}>
      {children}
    </HeaderContext>
  );
};
