'use client';

import { ProgressProvider } from '@bprogress/next/app';

export default function AppProgressProvider({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider
      height="1px"
      color="#5B7A4F"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
}
