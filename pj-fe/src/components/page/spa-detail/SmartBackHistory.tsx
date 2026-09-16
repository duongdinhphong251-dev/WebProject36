'use client';
import { useSmartBackHistory } from '@/hooks/useSmartBackHistory';
import type { ServiceResponseDto } from '@/types/api';

export function SmartBackHistory({ services }: { services?: ServiceResponseDto[] }) {
  useSmartBackHistory(services);
  return null;
}
