import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  bookings,
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
    const owner = await call<{ token: string; user: { id: string } }>(
      'auth/register/owner',
      'POST',
      undefined,
      { phone, password: 'Test@123456', fullName: 'Smoke Owner' },
    );
    ownerId = owner.user.id;
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
      },
    );
    dealId = createdDeal.id;
    await call(`admin/deals/${dealId}/approval`, 'PATCH', admin.token, {
      status: 'approved',
    });
    const visible = await call<{ id: string }[]>(
      `catalog/spas?city=${cityRows[0].slug}`,
      'GET',
      user.token,
    );
    assert(visible.some((item) => item.id === spaId));
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
    await call(`admin/users/${ownerId}/status`, 'PATCH', admin.token, {
      status: 'banned',
    });
    const banned = await fetch(`${base}/owner/spas`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });
    assert.equal(banned.status, 401);
    console.log(
      'Smoke test passed: owner, approval, catalog, saved, review, booking, expiry, ban.',
    );
  } finally {
    if (spaId) {
      await db.delete(bookings).where(eq(bookings.spaId, spaId));
      await db.delete(reviews).where(eq(reviews.spaId, spaId));
      await db.delete(savedSpas).where(eq(savedSpas.spaId, spaId));
      if (dealId) await db.delete(deals).where(eq(deals.id, dealId));
      await db.delete(spas).where(eq(spas.id, spaId));
    }
    if (ownerId) await db.delete(users).where(eq(users.id, ownerId));
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
