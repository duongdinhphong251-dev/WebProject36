// Regression checks for role boundaries and invalid input. Needs a running API.
// Keep failure expectations strict so regressions remain visible.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomInt, randomUUID } from 'node:crypto';
import { Pool } from 'pg';

const base = `http://localhost:${process.env.PORT || 8081}/api/v1`;
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5433),
  database: process.env.DB_NAME || 'tuoi_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});
type Account = { token: string; user: { id: string } };
const userIds: string[] = [];
let passed = 0;
let failed = 0;

async function request(
  path: string,
  token?: string,
  method = 'GET',
  body?: object,
) {
  return fetch(`${base}/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function ok<T>(
  path: string,
  token?: string,
  method = 'GET',
  body?: object,
): Promise<T> {
  const response = await request(path, token, method, body);
  assert(response.ok, `Setup ${method} ${path}: ${response.status}`);
  return response.json() as Promise<T>;
}

async function check(name: string, test: () => Promise<void>) {
  try {
    await test();
    passed++;
    console.log(`PASS ${name}`);
  } catch (error) {
    failed++;
    console.log(
      `FAIL ${name}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function register(owner = false) {
  const account = await ok<Account>(
    owner ? 'auth/register/owner' : 'auth/register',
    undefined,
    'POST',
    {
      phone: `09${randomInt(10000000, 99999999)}`,
      password: 'Audit@123456',
      fullName: 'Temporary Audit Account',
    },
  );
  userIds.push(account.user.id);
  return account;
}

async function main() {
  try {
    const admin = await ok<Account>('auth/login', undefined, 'POST', {
      phone: process.env.SEED_ADMIN_PHONE || '0900000001',
      password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123456',
    });
    const member = await register();
    const owner = await register(true);
    const otherOwner = await register(true);
    const cities = await ok<{ id: number }[]>('catalog/cities', member.token);
    assert(cities.length, 'Seed cities before auditing');
    const spa = await ok<{ id: string }>('owner/spas', owner.token, 'POST', {
      name: 'Audit Spa',
      address: 'Audit address',
      description: 'Temporary',
      phone: '0901234567',
      cityId: cities[0].id,
    });
    const deal = await ok<{ id: number }>('owner/deals', owner.token, 'POST', {
      spaId: spa.id,
      titleVi: 'Audit Voucher',
      description: 'Temporary',
      priceVnd: 100000,
    });
    const booking = {
      spaId: spa.id,
      dealId: deal.id,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    };
    const status = async (
      path: string,
      expected: number,
      token?: string,
      method = 'GET',
      body?: object,
    ) =>
      assert.equal((await request(path, token, method, body)).status, expected);

    await check('catalog requires login', () => status('catalog/spas', 401));
    await check('forged token rejected', () => status('auth/me', 401, 'fake'));
    await check('wrong password rejected', () =>
      status('auth/login', 401, undefined, 'POST', {
        phone: process.env.SEED_ADMIN_PHONE || '0900000001',
        password: 'Wrong@123456',
      }),
    );
    await check('user cannot access admin', () =>
      status('admin/users', 403, member.token),
    );
    await check('user cannot create spa', () =>
      status('owner/spas', 403, member.token, 'POST', {}),
    );
    await check('owner cannot use member endpoints', () =>
      status('me/bookings', 403, owner.token),
    );
    await check('owner cannot edit another spa', () =>
      status(`owner/spas/${spa.id}`, 403, otherOwner.token, 'PATCH', {
        name: 'Changed',
      }),
    );
    await check('owner cannot delete another voucher', () =>
      status(`owner/deals/${deal.id}`, 403, otherOwner.token, 'DELETE'),
    );
    await check('pending spa hidden', () =>
      status(`catalog/spas/${spa.id}`, 404, member.token),
    );
    await check('pending voucher cannot be claimed', () =>
      status(`me/vouchers/${deal.id}`, 400, member.token, 'POST'),
    );
    await check('pending spa cannot be booked', () =>
      status('me/bookings', 404, member.token, 'POST', booking),
    );
    await check('unknown body fields rejected', () =>
      status('owner/spas', 400, owner.token, 'POST', { injected: true }),
    );
    await check('admin cannot ban own account', () =>
      status(`admin/users/${admin.user.id}/status`, 400, admin.token, 'PATCH', {
        status: 'banned',
      }),
    );
    await check('invalid approval status rejected', () =>
      status(`admin/spas/${spa.id}/approval`, 400, admin.token, 'PATCH', {
        status: 'wrong',
      }),
    );

    await check(
      'PATCH clears optional Zalo and expiry without changing other fields',
      async () => {
        await ok(`owner/spas/${spa.id}`, owner.token, 'PATCH', {
          zalo: 'https://zalo.me/0901234567',
        });
        await ok(`owner/deals/${deal.id}`, owner.token, 'PATCH', {
          endAt: '2030-01-01T03:00:00Z',
        });
        await ok(`owner/spas/${spa.id}`, owner.token, 'PATCH', { zalo: null });
        await ok(`owner/deals/${deal.id}`, owner.token, 'PATCH', {
          endAt: null,
        });
        const ownedSpas = await ok<
          { id: string; name: string; zalo: string | null }[]
        >('owner/spas', owner.token);
        const ownedDeals = await ok<
          { id: number; titleVi: string; endAt: string | null }[]
        >('owner/deals', owner.token);
        assert.equal(ownedSpas.find((row) => row.id === spa.id)?.zalo, null);
        assert.equal(
          ownedSpas.find((row) => row.id === spa.id)?.name,
          'Audit Spa',
        );
        assert.equal(ownedDeals.find((row) => row.id === deal.id)?.endAt, null);
        assert.equal(
          ownedDeals.find((row) => row.id === deal.id)?.titleVi,
          'Audit Voucher',
        );
      },
    );
    await check('PATCH rejects null required fields', () =>
      status(`owner/spas/${spa.id}`, 400, owner.token, 'PATCH', { name: null }),
    );
    await check('PATCH rejects blank voucher title', () =>
      status(`owner/deals/${deal.id}`, 400, owner.token, 'PATCH', {
        titleVi: '   ',
      }),
    );
    await check('valid but nonexistent city rejected', () =>
      status(`owner/spas/${spa.id}`, 400, owner.token, 'PATCH', {
        cityId: 999999999,
      }),
    );

    await ok(`admin/spas/${spa.id}/approval`, admin.token, 'PATCH', {
      status: 'approved',
    });
    await ok(`admin/deals/${deal.id}/approval`, admin.token, 'PATCH', {
      status: 'approved',
    });
    await check('voucher query only returns the selected spa', async () => {
      const rows = await ok<{ id: number; spaId: string }[]>(
        `catalog/deals?spaId=${spa.id}`,
        member.token,
      );
      assert(rows.some((row) => row.id === deal.id));
      assert(rows.every((row) => row.spaId === spa.id));
      const missing = await ok<unknown[]>(
        `catalog/deals?spaId=${randomUUID()}`,
        member.token,
      );
      assert.equal(missing.length, 0);
    });
    await check('past booking rejected', () =>
      status('me/bookings', 400, member.token, 'POST', {
        spaId: spa.id,
        scheduledAt: '2020-01-01T00:00:00Z',
      }),
    );
    await check('malformed spa ID in body rejected', () =>
      status('me/reviews', 400, member.token, 'POST', {
        spaId: 'bad-id',
        rating: 5,
        comment: 'Test',
      }),
    );
    await check('save twice produces one row', async () => {
      await ok(`me/saved/${spa.id}`, member.token, 'POST');
      await ok(`me/saved/${spa.id}`, member.token, 'POST');
      const saved = await ok<{ id: string }[]>('me/saved', member.token);
      assert.equal(saved.filter((row) => row.id === spa.id).length, 1);
      await ok(`me/saved/${spa.id}`, member.token, 'DELETE');
      const after = await ok<{ id: string }[]>('me/saved', member.token);
      assert(!after.some((row) => row.id === spa.id));
    });
    await check('blank review rejected', () =>
      status('me/reviews', 400, member.token, 'POST', {
        spaId: spa.id,
        rating: 5,
        comment: '   ',
      }),
    );
    // Isolate the next test even when blank-review validation is broken.
    await pool.query('DELETE FROM reviews WHERE user_id = $1 AND spa_id = $2', [
      member.user.id,
      spa.id,
    ]);
    await check('duplicate review rejected', async () => {
      await ok('me/reviews', member.token, 'POST', {
        spaId: spa.id,
        rating: 5,
        comment: 'Good',
      });
      await status('me/reviews', 400, member.token, 'POST', {
        spaId: spa.id,
        rating: 4,
        comment: 'Again',
      });
    });
    await check('malformed spa URL gives 400', () =>
      status('catalog/spas/not-an-id', 400, member.token),
    );
    await check('malformed voucher URL gives 400', () =>
      status('catalog/deals/not-a-number', 400, member.token),
    );
    await check('approving nonexistent spa gives 404', () =>
      status(`admin/spas/${randomUUID()}/approval`, 404, admin.token, 'PATCH', {
        status: 'approved',
      }),
    );
    await check('approving nonexistent voucher gives 404', () =>
      status(
        'admin/deals/9007199254740991/approval',
        404,
        admin.token,
        'PATCH',
        { status: 'approved' },
      ),
    );
    await check('invalid save URL rejected before DB query', () =>
      status('me/saved/bad-id', 400, member.token, 'POST'),
    );
    await check('editing to nonexistent city gives 400', () =>
      status(`owner/spas/${spa.id}`, 400, owner.token, 'PATCH', { cityId: -1 }),
    );
    await check('invalid image bytes rejected', async () => {
      const data = new FormData();
      data.set(
        'file',
        new Blob(['not a PNG'], { type: 'image/png' }),
        'bad.png',
      );
      const response = await fetch(`${base}/owner/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${owner.token}` },
        body: data,
      });
      assert.equal(response.status, 400);
    });
    await check('oversize image rejected', async () => {
      const data = new FormData();
      data.set(
        'file',
        new Blob([new Uint8Array(2 * 1024 * 1024 + 1)], { type: 'image/png' }),
        'large.png',
      );
      const response = await fetch(`${base}/owner/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${owner.token}` },
        body: data,
      });
      assert.equal(response.status, 413);
    });
    await ok(`me/vouchers/${deal.id}`, member.token, 'POST');
    await ok(`owner/spas/${spa.id}`, owner.token, 'PATCH', {
      name: 'Audit Spa edited',
    });
    await check('edited spa hides its approved voucher', () =>
      status(`catalog/deals/${deal.id}`, 404, member.token),
    );
    await check(
      'wallet marks voucher unavailable while spa pending',
      async () => {
        const wallet = await ok<
          {
            dealId: number;
            status: string;
            approvalStatus: string;
            spaApprovalStatus?: string;
          }[]
        >('me/vouchers', member.token);
        const item = wallet.find((row) => row.dealId === deal.id)!;
        assert(
          item.status !== 'available' ||
            item.approvalStatus !== 'approved' ||
            item.spaApprovalStatus === 'pending',
          'wallet still reports available + approved, with no spa status',
        );
      },
    );
    await ok(`admin/spas/${spa.id}/approval`, admin.token, 'PATCH', {
      status: 'approved',
    });
    await check(
      'two simultaneous bookings use voucher exactly once',
      async () => {
        const responses = await Promise.all([
          request('me/bookings', member.token, 'POST', booking),
          request('me/bookings', member.token, 'POST', booking),
        ]);
        assert.deepEqual(responses.map((row) => row.status).sort(), [201, 400]);
        const history = await ok<{ dealId: number }[]>(
          'me/bookings',
          member.token,
        );
        assert.equal(history.filter((row) => row.dealId === deal.id).length, 1);
      },
    );
    await check('other owner cannot see booking', async () => {
      const history = await ok<{ spaId?: string; spaName: string }[]>(
        'owner/bookings',
        otherOwner.token,
      );
      assert.equal(history.length, 0);
    });
    await check(
      'two simultaneous reviews create one review without a server error',
      async () => {
        await pool.query(
          'DELETE FROM reviews WHERE user_id = $1 AND spa_id = $2',
          [member.user.id, spa.id],
        );
        const body = { spaId: spa.id, rating: 5, comment: 'Concurrent review' };
        const responses = await Promise.all([
          request('me/reviews', member.token, 'POST', body),
          request('me/reviews', member.token, 'POST', body),
        ]);
        assert.deepEqual(responses.map((row) => row.status).sort(), [201, 400]);
        const rows = await ok<{ spaId: string }[]>('me/reviews', member.token);
        assert.equal(rows.filter((row) => row.spaId === spa.id).length, 1);
      },
    );
    await ok(`admin/users/${member.user.id}/status`, admin.token, 'PATCH', {
      status: 'banned',
    });
    await check('banning revokes existing token access', () =>
      status('auth/me', 401, member.token),
    );
    await ok(`admin/users/${member.user.id}/status`, admin.token, 'PATCH', {
      status: 'active',
    });
    await check('unbanning restores account access', () =>
      status('auth/me', 200, member.token),
    );
    await check('account listing hides password hashes', async () => {
      const accounts = await ok<Record<string, unknown>[]>(
        'admin/users',
        admin.token,
      );
      assert(
        accounts.every(
          (row) => !('passwordHash' in row) && !('password' in row),
        ),
      );
    });
  } finally {
    // Only remove records belonging to accounts created by this run.
    try {
      if (userIds.length) {
        await pool.query(
          'DELETE FROM bookings WHERE user_id = ANY($1::uuid[])',
          [userIds],
        );
        await pool.query(
          'DELETE FROM reviews WHERE user_id = ANY($1::uuid[])',
          [userIds],
        );
        await pool.query(
          'DELETE FROM saved_spas WHERE user_id = ANY($1::uuid[])',
          [userIds],
        );
        await pool.query(
          'DELETE FROM claimed_vouchers WHERE user_id = ANY($1::uuid[])',
          [userIds],
        );
        await pool.query(
          'DELETE FROM deals WHERE spa_id IN (SELECT id FROM spas WHERE owner_id = ANY($1::uuid[]))',
          [userIds],
        );
        await pool.query('DELETE FROM spas WHERE owner_id = ANY($1::uuid[])', [
          userIds,
        ]);
        await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [
          userIds,
        ]);
      }
    } finally {
      await pool.end();
    }
  }
  console.log(
    `Audit: ${passed} passed, ${failed} failed. Temporary records removed.`,
  );
  if (failed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
