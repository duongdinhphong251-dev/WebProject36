'use client';
import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { City, Deal, Spa } from '@/lib/api';

import { SpaFields, DealFields } from './OwnerFields';
import { requestJson, errorMessage } from '@/lib/client-api';
import { toIsoDateTime, toLocalDateTime } from '@/lib/date-time';

async function uploadCover(file: File): Promise<string> {
  if (file.size > 2 * 1024 * 1024) throw new Error('Ảnh tối đa 2 MB.');
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('Chọn ảnh PNG, JPEG hoặc WebP.');
  const upload = new FormData();
  upload.set('file', file);
  const result = await requestJson<{ image: string }>(
    '/api/backend/owner/images',
    'POST',
    upload,
  );
  return result.image;
}

export function OwnerForm({
  kind,
  cities,
  spas,
  item,
}: {
  kind: 'spa' | 'deal';
  cities?: City[];
  spas?: Spa[];
  item?: Spa | Deal;
}) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const imageFile = form.get('imageFile');
    form.delete('imageFile');
    try {
      // Build only the fields accepted by each API. Empty optional values clear old data.
      const text = (name: string) => String(form.get(name) || '').trim();
      const body: Record<string, string | number | null> =
        kind === 'spa'
          ? {
              name: text('name'),
              address: text('address'),
              description: text('description'),
              phone: text('phone'),
              cityId: Number(text('cityId')),
              zalo: text('zalo') || null,
            }
          : {
              titleVi: text('titleVi'),
              titleEn: text('titleEn'),
              description: text('description'),
              priceVnd: Number(text('priceVnd')),
              endAt: toIsoDateTime(text('endAt')),
              ...(!item && { spaId: text('spaId') }),
            };
      // Preserve seconds on an unchanged expiry; the input displays only minutes.
      if (deal?.endAt && text('endAt') === toLocalDateTime(deal.endAt))
        body.endAt = deal.endAt;
      if (imageFile instanceof File && imageFile.size > 0)
        body.image = await uploadCover(imageFile);
      const collection = kind === 'spa' ? 'spas' : 'deals';
      const path = `/api/backend/owner/${collection}${item ? `/${item.id}` : ''}`;
      await requestJson(path, item ? 'PATCH' : 'POST', body);
      setMessage('Đã lưu, đang chờ admin duyệt.');
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const spa = kind === 'spa' ? (item as Spa | undefined) : undefined;
  const deal = kind === 'deal' ? (item as Deal | undefined) : undefined;
  return (
    <form className="card stack" onSubmit={submit}>
      {kind === 'spa' ? (
        <SpaFields spa={spa} cities={cities || []} />
      ) : (
        <DealFields deal={deal} spas={spas || []} />
      )}
      <label>
        Ảnh bìa (PNG, JPEG hoặc WebP, tối đa 2 MB)
        <input
          className="input"
          name="imageFile"
          type="file"
          accept="image/png,image/jpeg,image/webp"
        />
      </label>
      {(spa?.image || deal?.image) && (
        <Image
          className="owner-image-preview"
          src={(spa?.image || deal?.image)!}
          alt="Ảnh bìa hiện tại"
          width={180}
          height={120}
          unoptimized
        />
      )}
      <button className="button" disabled={busy}>
        {busy ? 'Đang lưu...' : item ? 'Lưu thay đổi' : 'Tạo mới'}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
