'use client';

import type { NotifySeverity } from '@/stores/notify/notify.store';
import { AlertTriangle, BadgeAlert, CheckCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useNotifyStore } from '@/stores/notify/notify.store';

const CONFIG: Record<NotifySeverity, {
  Icon: React.ElementType;
  bg: string;
  border: string;
  color: string;
}> = {
  info: { Icon: Info, bg: '#CDE8F6', border: '#5B9BC4', color: '#447EAF' },
  warning: { Icon: AlertTriangle, bg: '#F8F4D5', border: '#C9B870', color: '#96722E' },
  error: { Icon: BadgeAlert, bg: '#ECC8C5', border: '#C97B76', color: '#B83C37' },
  success: { Icon: CheckCircle, bg: '#DDF3D5', border: '#84AC79', color: '#597151' },
};

export function NotifySnackbar() {
  const { open, content, title, severity, duration, position, close } = useNotifyStore(
    useShallow(s => ({
      open: s.open,
      content: s.content,
      title: s.title,
      severity: s.severity,
      duration: s.duration,
      position: s.position,
      close: s.close,
    })),
  );

  const [visible, setVisible] = useState(false);
  const [render, setRender] = useState(false);

  useEffect(() => {
    let visibilityTimer: ReturnType<typeof setTimeout>;
    let actionTimer: ReturnType<typeof setTimeout>;

    let renderTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;
    if (open) {
      renderTimer = setTimeout(() => setRender(true), 0);
      visibilityTimer = setTimeout(() => setVisible(true), 10);

      if (duration) {
        actionTimer = setTimeout(() => {
          setVisible(false);
          setTimeout(() => close(), 300);
        }, duration);
      }
    } else {
      hideTimer = setTimeout(() => setVisible(false), 0);
      actionTimer = setTimeout(() => setRender(false), 300);
    }

    return () => {
      clearTimeout(renderTimer);
      clearTimeout(hideTimer);
      clearTimeout(visibilityTimer);
      clearTimeout(actionTimer);
    };
  }, [open, duration, close]);

  if (!render) {
    return null;
  }

  const { Icon, bg, border, color } = CONFIG[severity];

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => close(), 300);
  };

  const isTop = position.vertical === 'top';
  const isBottom = position.vertical === 'bottom';
  const isLeft = position.horizontal === 'left';
  const isRight = position.horizontal === 'right';
  const isCenter = position.horizontal === 'center';

  return (
    <div
      className={`fixed z-[9999] transition-all duration-300 ease-in-out ${
        visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      } ${isTop ? 'top-4' : ''} ${isBottom ? 'bottom-4' : ''} ${
        isLeft ? 'left-4' : ''
      } ${isRight ? 'right-4' : ''} ${
        isCenter ? 'left-1/2 -ml-[calc(50vw-16px)] sm:-ml-[220px]' : ''
      }`}
    >
      <div
        className="flex w-[calc(100vw-32px)] items-center overflow-hidden rounded-md p-4 sm:w-[440px]"
        style={{
          backgroundColor: bg,
          border: `2px solid ${border}`,
          color,
        }}
      >
        <div className="flex shrink-0 items-center px-2 py-1.5">
          <Icon className="h-6 w-6 text-inherit" />
        </div>
        <div className="min-w-0 flex-1 py-1.5 text-sm leading-relaxed break-words">
          {title
            ? (
                <strong className="mr-1">
                  {title}
                  :
                </strong>
              )
            : null}
          {content}
        </div>
        <button
          onClick={handleClose}
          className="mx-2 shrink-0 cursor-pointer border-none bg-transparent p-1 text-inherit opacity-45 transition-opacity hover:opacity-85"
        >
          <X className="h-5 w-5 text-inherit" />
        </button>
      </div>
    </div>
  );
}
