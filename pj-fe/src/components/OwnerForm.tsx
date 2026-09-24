'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { City, Deal, Spa } from '@/lib/api';

export function OwnerForm({ kind, cities, spas, item }: { kind: 'spa' | 'deal'; cities?: City[]; spas?: Spa[]; item?: Spa | Deal }) {
  const router = useRouter(); const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    if (kind === 'spa' && !values.zalo) delete values.zalo;
    if (kind === 'deal') { if (values.endAt) values.endAt = new Date(String(values.endAt)).toISOString(); else delete values.endAt; }
    const body = kind === 'spa' ? { ...values, cityId: Number(values.cityId) } : { ...values, priceVnd: Number(values.priceVnd) };
    const path = `owner/${kind === 'spa' ? 'spas' : 'deals'}${item ? `/${item.id}` : ''}`;
    const response = await fetch(`/api/backend/${path}`, { method: item ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result: { message?: string | string[] } = await response.json();
    setMessage(response.ok ? 'Đã lưu, đang chờ admin duyệt.' : Array.isArray(result.message) ? result.message.join(', ') : result.message || 'Có lỗi xảy ra');
    if (response.ok) router.refresh();
  }
  const spa = kind === 'spa' ? item as Spa | undefined : undefined;
  const deal = kind === 'deal' ? item as Deal | undefined : undefined;
  return <form className="card stack" onSubmit={submit}>
    {kind === 'spa' ? <>
      <label>Tên spa<input className="input" name="name" defaultValue={spa?.name || ''} required /></label>
      <label>Địa chỉ<input className="input" name="address" defaultValue={spa?.address || ''} required /></label>
      <label>Mô tả<textarea className="input" name="description" defaultValue={spa?.description || ''} required /></label>
      <label>Số điện thoại<input className="input" name="phone" defaultValue={spa?.phone || ''} required /></label>
      <label>Zalo URL<input className="input" name="zalo" defaultValue={spa?.zalo || ''} /></label>
      <label>Thành phố<select className="input" name="cityId" defaultValue={spa?.cityId || ''} required><option value="">Chọn thành phố</option>{cities?.map(city => <option key={city.id} value={city.id}>{city.nameVi}</option>)}</select></label>
    </> : <>
      {!deal && <label>Spa<select className="input" name="spaId" required><option value="">Chọn spa</option>{spas?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
      <label>Tên voucher<input className="input" name="titleVi" defaultValue={deal?.titleVi || ''} required /></label>
      <label>Tên tiếng Anh<input className="input" name="titleEn" defaultValue={deal?.titleEn || ''} /></label>
      <label>Mô tả<textarea className="input" name="description" defaultValue={deal?.description || ''} required /></label>
      <label>Giá VND<input className="input" name="priceVnd" type="number" min="0" defaultValue={deal?.priceVnd || 0} required /></label>
      <label>Hết hạn (tùy chọn)<input className="input" name="endAt" type="datetime-local" defaultValue={deal?.endAt ? new Date(deal.endAt).toISOString().slice(0, 16) : ''} /></label>
    </>}
    <button className="button">{item ? 'Lưu thay đổi' : 'Tạo mới'}</button>{message && <p role="status">{message}</p>}
  </form>;
}
