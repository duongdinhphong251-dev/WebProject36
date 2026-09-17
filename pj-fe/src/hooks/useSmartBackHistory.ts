'use client';

import type { ServiceResponseDto } from '@/types/api';

/**
 * Disabled: hook gốc dùng window.location.replace() để "làm sạch history"
 * khi user vào trang detail bằng deep link, nhưng gây redirect loop vô tận
 * giữa /en và /en/provider/<slug>.
 */
export function useSmartBackHistory(services?: ServiceResponseDto[]) {
  void services;
  return;
}