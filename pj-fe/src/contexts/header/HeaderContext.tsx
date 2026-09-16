import type { MenuItem } from '@/types/menu';
import { createContext, use } from 'react';

export interface HeaderContextProps {
  headerHeight: number;
  setHeaderHeight: (val: number) => void;
  mainMenu: MenuItem[];
}

export const HeaderContext = createContext<HeaderContextProps | undefined>(undefined);

export const useHeader = () => {
  const ctx = use(HeaderContext);
  if (!ctx) {
    throw new Error('useHeader must be used within HeaderProvider');
  }
  return ctx;
};
