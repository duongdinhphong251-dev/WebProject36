'use client';
import { useEffect, useRef } from 'react';
import type { City, Deal, Spa } from '@/lib/api';
import { toLocalDateTime } from '@/lib/date-time';

export function SpaFields({ spa, cities }: { spa?: Spa; cities: City[] }) {
  return (
    <>
      <label>
        Tên spa
        <input
          className="input"
          name="name"
          defaultValue={spa?.name || ''}
          required
        />
      </label>
      <label>
        Địa chỉ
        <input
          className="input"
          name="address"
          defaultValue={spa?.address || ''}
          required
        />
      </label>
      <label>
        Mô tả
        <textarea
          className="input"
          name="description"
          defaultValue={spa?.description || ''}
          required
        />
      </label>
      <label>
        Số điện thoại
        <input
          className="input"
          name="phone"
          defaultValue={spa?.phone || ''}
          required
        />
      </label>
      <label>
        Zalo URL
        <input className="input" name="zalo" defaultValue={spa?.zalo || ''} />
      </label>
      <label>
        Thành phố
        <select
          className="input"
          name="cityId"
          defaultValue={spa?.cityId || ''}
          required
        >
          <option value="">Chọn thành phố</option>
          {cities?.map((city) => (
            <option key={city.id} value={city.id}>
              {city.nameVi}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

export function DealFields({ deal, spas }: { deal?: Deal; spas: Spa[] }) {
  const endAtInput = useRef<HTMLInputElement>(null);
  // Fill after mounting so the browser's timezone is used, even if the server differs.
  useEffect(() => {
    if (endAtInput.current)
      endAtInput.current.value = toLocalDateTime(deal?.endAt);
  }, [deal?.endAt]);
  return (
    <>
      {!deal && (
        <label>
          Spa
          <select className="input" name="spaId" required>
            <option value="">Chọn spa</option>
            {spas?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Tên voucher
        <input
          className="input"
          name="titleVi"
          defaultValue={deal?.titleVi || ''}
          required
        />
      </label>
      <label>
        Tên tiếng Anh
        <input
          className="input"
          name="titleEn"
          defaultValue={deal?.titleEn || ''}
        />
      </label>
      <label>
        Mô tả
        <textarea
          className="input"
          name="description"
          defaultValue={deal?.description || ''}
          required
        />
      </label>
      <label>
        Giá VND
        <input
          className="input"
          name="priceVnd"
          type="number"
          min="0"
          defaultValue={deal?.priceVnd || 0}
          required
        />
      </label>
      <label>
        Hết hạn (tùy chọn)
        <input
          className="input"
          name="endAt"
          type="datetime-local"
          ref={endAtInput}
        />
      </label>
    </>
  );
}
