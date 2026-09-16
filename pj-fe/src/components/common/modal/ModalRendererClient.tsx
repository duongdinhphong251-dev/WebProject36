'use client';

import dynamic from 'next/dynamic';

const ModalRenderer = dynamic(() => import('./ModalRenderer'), { ssr: false });

export function ModalRendererClient() {
  return <ModalRenderer />;
}
