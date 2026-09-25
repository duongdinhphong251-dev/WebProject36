import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  bookings,
  claimedVouchers,
  deals,
  reviews,
  savedSpas,
  spas,
  users,
} from '../src/core/schema';

const base = `http://localhost:${process.env.PORT || 8081}/api/v1`;
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5433),
  database: process.env.DB_NAME || 'tuoi_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});
const db = drizzle(pool);

async function call<T>(
  path: string,
  method = 'GET',
  token?: string,
  body?: object,
): Promise<T> {
  const response = await fetch(`${base}/${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data: unknown = await response.json();
  if (!response.ok)
    throw new Error(
      `${method} ${path}: ${response.status} ${JSON.stringify(data)}`,
    );
  return data as T;
}

async function main() {
  let ownerId: string | undefined;
  let spaId: string | undefined;
  let dealId: number | undefined;
  let uploadedImage: string | undefined;
  let legacyUserId: string | undefined;
  const phone = `09${randomInt(10000000, 99999999)}`;
  try {
    const admin = await call<{ token: string }>(
      'auth/login',
      'POST',
      undefined,
      {
        phone: process.env.SEED_ADMIN_PHONE || '0900000001',
        password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123456',
      },
    );
    const user = await call<{ token: string }>(
      'auth/login',
      'POST',
      undefined,
      {
        phone: process.env.SEED_USER_PHONE || '0900000003',
        password: process.env.SEED_USER_PASSWORD || 'User@123456',
      },
    );
    const publicSpas = await call<{ id: string }[]>(
      'catalog/spas',
      'GET',
      user.token,
    );
    const legacySpa = publicSpas.find(
      (item) => item.id === '11111111-1111-1111-1111-111111111111',
    );
    if (legacySpa) {
      const legacyUser = await call<{ token: string; user: { id: string } }>(
        'auth/register',
        'POST',
        undefined,
        {
          phone: `09${randomInt(10000000, 99999999)}`,
          password: 'Test@123456',
          fullName: 'Legacy ID Test',
        },
      );
      legacyUserId = legacyUser.user.id;
      await call('me/reviews', 'POST', legacyUser.token, {
        spaId: legacySpa.id,
        rating: 5,
        comment: 'Legacy ID smoke test',
      });
      await call('me/bookings', 'POST', legacyUser.token, {
        spaId: legacySpa.id,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
    }
    const owner = await call<{ token: string; user: { id: string } }>(
      'auth/register/owner',
      'POST',
      undefined,
      { phone, password: 'Test@123456', fullName: 'Smoke Owner' },
    );
    ownerId = owner.user.id;
    const imageForm = new FormData();
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pZkAAAAASUVORK5CYII=',
      'base64',
    );
    imageForm.set(
      'file',
      new Blob([new Uint8Array(png)], { type: 'image/png' }),
      'smoke.png',
    );
    const imageResponse = await fetch(`${base}/owner/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${owner.token}` },
      body: imageForm,
    });
    assert.equal(imageResponse.status, 201);
    const imageData = (await imageResponse.json()) as { image: string };
    uploadedImage = imageData.image;
    assert.match(uploadedImage, /^\/uploads\/[0-9a-f-]+\.png$/);
    const displayedImage = await fetch(
      `http://localhost:${process.env.PORT || 8081}${uploadedImage}`,
    );
    assert.equal(displayedImage.status, 200);
    const cityRows = await call<{ id: number; slug: string }[]>(
      'catalog/cities',
      'GET',
      user.token,
    );
    const createdSpa = await call<{ id: string }>(
      'owner/spas',
      'POST',
      owner.token,
      {
        name: 'Smoke Spa',
        address: 'Test address',
        description: 'Temporary test spa',
        phone,
        cityId: cityRows[0].id,
        image: uploadedImage,
      },
    );
    spaId = createdSpa.id;
    await call(`admin/spas/${spaId}/approval`, 'PATCH', admin.token, {
      status: 'approved',
    });
    const createdDeal = await call<{ id: number }>(
      'owner/deals',
      'POST',
      owner.token,
      {
        spaId,
        titleVi: 'Smoke Voucher',
        description: 'Temporary test deal',
        priceVnd: 100000,
        image: uploadedImage,
      },
    );
    dealId = createdDeal.id;
    await call(`admin/deals/${dealId}/approval`, 'PATCH', admin.token, {
      status: 'approved',
    });
    await assert.rejects(
      call('me/bookings', 'POST', user.token, {
        spaId,
        dealId,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      }),
      /Claim this voucher before booking/,
    );
    await call(`me/vouchers/${dealId}`, 'POST', user.token);
    await assert.rejects(
      call(`me/vouchers/${dealId}`, 'POST', user.token),
      /already claimed/,
    );
    const claimed = await call<{ dealId: number; status: string }[]>(
      'me/vouchers',
      'GET',
      user.token,
    );
    assert.equal(
      claimed.find((item) => item.dealId === dealId)?.status,
      'available',
    );
    const visible = await call<{ id: string; image: string | null }[]>(
      `catalog/spas?city=${cityRows[0].slug}`,
      'GET',
      user.token,
    );
    assert.equal(
      visible.find((item) => item.id === spaId)?.image,
      uploadedImage,
    );
    const visibleDeals = await call<{ id: number; image: string | null }[]>(
      'catalog/deals',
      'GET',
      user.token,
    );
    assert.equal(
      visibleDeals.find((item) => item.id === dealId)?.image,
      uploadedImage,
    );
    await call(`me/saved/${spaId}`, 'POST', user.token);
    await call('me/reviews', 'POST', user.token, {
      spaId,
      rating: 5,
      comment: 'Smoke test',
    });
    await call('me/bookings', 'POST', user.token, {
      spaId,
      dealId,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    });
    const history = await call<{ spaId: string }[]>(
      'me/bookings',
      'GET',
      user.token,
    );
    assert(history.some((item) => item.spaId === spaId));
    const used = await call<{ dealId: number; status: string }[]>(
      'me/vouchers',
      'GET',
      user.token,
    );
    assert.equal(used.find((item) => item.dealId === dealId)?.status, 'used');
    await assert.rejects(
      call(`owner/deals/${dealId}`, 'DELETE', owner.token),
      /Voucher has bookings and cannot be deleted/,
    );
    await assert.rejects(
      call('me/bookings', 'POST', user.token, {
        spaId,
        dealId,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      }),
      /already been used/,
    );
    await call(`owner/deals/${dealId}`, 'PATCH', owner.token, {
      endAt: new Date(Date.now() - 86400000).toISOString(),
    });
    await call(`admin/deals/${dealId}/approval`, 'PATCH', admin.token, {
      status: 'approved',
    });
    const activeDeals = await call<{ id: number }[]>(
      'catalog/deals',
      'GET',
      user.token,
    );
    assert(!activeDeals.some((item) => item.id === dealId));
    const ownDeals = await call<{ id: number; approvalStatus: string }[]>(
      'owner/deals',
      'GET',
      owner.token,
    );
    assert.equal(
      ownDeals.find((item) => item.id === dealId)?.approvalStatus,
      'expired',
    );
    await assert.rejects(
      call(`me/vouchers/${dealId}`, 'POST', user.token),
      /Voucher is unavailable/,
    );
    await call(`admin/users/${ownerId}/status`, 'PATCH', admin.token, {
      status: 'banned',
    });
    const banned = await fetch(`${base}/owner/spas`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });
    assert.equal(banned.status, 401);
    console.log(
      `Smoke test passed: upload, owner, approval, voucher claim/use, catalog, saved, review, booking, expiry, ban${legacySpa ? ', legacy demo spa ID' : ''}.`,
    );
  } finally {
    if (spaId) {
      await db.delete(bookings).where(eq(bookings.spaId, spaId));
      await db.delete(reviews).where(eq(reviews.spaId, spaId));
      await db.delete(savedSpas).where(eq(savedSpas.spaId, spaId));
      if (dealId) {
        await db
          .delete(claimedVouchers)
          .where(eq(claimedVouchers.dealId, dealId));
        await db.delete(deals).where(eq(deals.id, dealId));
      }
      await db.delete(spas).where(eq(spas.id, spaId));
    }
    if (ownerId) await db.delete(users).where(eq(users.id, ownerId));
    if (legacyUserId) {
      await db.delete(bookings).where(eq(bookings.userId, legacyUserId));
      await db.delete(reviews).where(eq(reviews.userId, legacyUserId));
      await db.delete(users).where(eq(users.id, legacyUserId));
    }
    if (uploadedImage)
      await unlink(
        resolve(process.cwd(), 'uploads', uploadedImage.split('/').at(-1)!),
      );
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
