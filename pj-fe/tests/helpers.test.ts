import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { toIsoDateTime, toLocalDateTime } from '../src/lib/date-time';
import { requestJson } from '../src/lib/client-api';

const originalFetch = globalThis.fetch;
const originalTimezone = process.env.TZ;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
});

test('editing an expiry preserves its instant in Vietnam', () => {
  process.env.TZ = 'Asia/Ho_Chi_Minh';
  const original = '2030-01-01T03:00:00.000Z';
  assert.equal(toLocalDateTime(original), '2030-01-01T10:00');
  assert.equal(toIsoDateTime(toLocalDateTime(original)), original);
});

test('expiry round-trip also works in UTC', () => {
  process.env.TZ = 'UTC';
  const original = '2030-01-01T03:00:00.000Z';
  assert.equal(toIsoDateTime(toLocalDateTime(original)), original);
});

test('blank expiry explicitly clears the value', () => {
  assert.equal(toIsoDateTime(''), null);
  assert.equal(toLocalDateTime(null), '');
});

test('JSON requests retain an explicit null field', async () => {
  globalThis.fetch = async (_input, options) => {
    assert.equal(options?.method, 'PATCH');
    assert.equal(options?.body, '{"endAt":null}');
    return Response.json({ saved: true });
  };
  assert.deepEqual(
    await requestJson('/api/backend/owner/deals/1', 'PATCH', { endAt: null }),
    { saved: true },
  );
});

test('multipart upload leaves Content-Type boundary to the browser', async () => {
  const form = new FormData();
  form.set('file', new Blob(['image']), 'cover.png');
  globalThis.fetch = async (_input, options) => {
    assert.equal(options?.body, form);
    assert.equal(options?.headers, undefined);
    return Response.json({ image: '/uploads/test.png' });
  };
  await requestJson('/api/backend/owner/images', 'POST', form);
});

test('API validation messages are combined into one readable error', async () => {
  globalThis.fetch = async () =>
    Response.json(
      { message: ['name required', 'city required'] },
      { status: 400 },
    );
  await assert.rejects(
    requestJson('/api/backend/owner/spas', 'POST', {}),
    /name required, city required/,
  );
});

test('expired session gives a clear login message', async () => {
  globalThis.fetch = async () => Response.json({}, { status: 401 });
  await assert.rejects(
    requestJson('/api/backend/me/bookings', 'POST', {}),
    /đăng nhập lại/,
  );
});

test('wrong login credentials retain the API error instead of a session error', async () => {
  globalThis.fetch = async () =>
    Response.json({ message: 'Invalid phone or password' }, { status: 401 });
  await assert.rejects(
    requestJson('/api/auth/login', 'POST', {}),
    /Invalid phone or password/,
  );
});
