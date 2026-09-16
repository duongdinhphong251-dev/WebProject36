'use client';

import type { MenuItem } from '@/types/menu';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import ListMenuMobile from './ListMenuMobile';

export default function OverflowButton({
  data,
}: {
  data: MenuItem[];
}) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [open, setOpen] = useState(false);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  return (
    <div
      className="relative flex-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Button
        variant="ghost"
        className="text-foreground min-w-auto p-2 hover:bg-transparent"
      >
        <span className="text-lg leading-none font-bold tracking-[0.2em]">•••</span>
      </Button>
      {open && (
        <div className="bg-background absolute top-full left-0 z-50 mt-1 max-h-[500px] w-[300px] overflow-auto rounded-md p-4 shadow-[0px_4px_12px_rgba(0,0,0,0.1)]">
          <ListMenuMobile menuRender={data} />
        </div>
      )}
    </div>
  );
}
