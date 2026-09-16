'use client';

import { GeoLink } from './geo-link';
import type { GeoChild } from '@/types/geo';

interface GeoNavigationProps {
  children: GeoChild[];
  baseUrl: string;
  level: string;
}

export function GeoNavigation({
  children,
  baseUrl,
  level,
}: GeoNavigationProps) {
  if (children.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Không có dữ liệu địa điểm
      </div>
    );
  }

  const levelLabel = {
    city: 'Chọn tỉnh/thành phố',
    district: 'Chọn quận/huyện',
    ward: 'Chọn phường/xã',
    'sub-ward': 'Chọn địa điểm',
  }[level] || 'Chọn địa điểm';

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">{levelLabel}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {children.map(child => (
          <GeoLink
            key={child.id}
            geoChild={child}
            baseUrl={baseUrl}
          />
        ))}
      </div>
    </div>
  );
}
