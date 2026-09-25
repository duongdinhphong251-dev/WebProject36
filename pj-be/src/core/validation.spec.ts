import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './auth';
import { BookingDto, ReviewDto } from './member';
import { DealDto, EditDealDto, EditSpaDto } from './owner';
import { PositiveIntPipe, UuidPipe } from './ids';

describe('input validation', () => {
  it('rejects weak credentials', async () => {
    const value = plainToInstance(RegisterDto, {
      phone: '123',
      password: 'short',
      fullName: '',
    });
    expect(
      (await validate(value)).map((error) => error.property).sort(),
    ).toEqual(['fullName', 'password', 'phone']);
  });

  it('rejects ratings outside 1–5', async () => {
    const value = plainToInstance(ReviewDto, {
      spaId: '38effcd6-0b24-4adf-9f92-128842a20999',
      rating: 6,
      comment: 'Test',
    });
    expect(
      (await validate(value)).some((error) => error.property === 'rating'),
    ).toBe(true);
  });

  it('rejects negative voucher prices', async () => {
    const value = plainToInstance(DealDto, {
      spaId: '38effcd6-0b24-4adf-9f92-128842a20999',
      titleVi: 'Voucher',
      description: 'Test',
      priceVnd: -1,
    });
    expect(
      (await validate(value)).some((error) => error.property === 'priceVnd'),
    ).toBe(true);
  });

  it('accepts existing PostgreSQL spa IDs used by demo data', async () => {
    const spaId = '11111111-1111-1111-1111-111111111111';
    const review = plainToInstance(ReviewDto, {
      spaId,
      rating: 5,
      comment: 'Good',
    });
    const booking = plainToInstance(BookingDto, {
      spaId,
      scheduledAt: '2030-01-01T10:00:00.000Z',
    });
    expect(await validate(review)).toEqual([]);
    expect(await validate(booking)).toEqual([]);
  });

  it('rejects malformed spa IDs', async () => {
    const review = plainToInstance(ReviewDto, {
      spaId: 'not-an-id',
      rating: 5,
      comment: 'Good',
    });
    expect(
      (await validate(review)).some((error) => error.property === 'spaId'),
    ).toBe(true);
  });

  it('rejects whitespace-only names and reviews', async () => {
    const registration = plainToInstance(RegisterDto, {
      phone: '0901234567',
      password: 'Test@123456',
      fullName: '   ',
    });
    const review = plainToInstance(ReviewDto, {
      spaId: '11111111-1111-1111-1111-111111111111',
      rating: 5,
      comment: '  ',
    });
    expect(
      (await validate(registration)).map((error) => error.property),
    ).toContain('fullName');
    expect((await validate(review)).map((error) => error.property)).toContain(
      'comment',
    );
  });

  it('PATCH allows omitted fields but not blank or null required fields', async () => {
    expect(await validate(plainToInstance(EditSpaDto, {}))).toEqual([]);
    expect(await validate(plainToInstance(EditDealDto, {}))).toEqual([]);
    for (const name of ['  ', null]) {
      expect(
        (await validate(plainToInstance(EditSpaDto, { name }))).length,
      ).toBeGreaterThan(0);
    }
    expect(
      (await validate(plainToInstance(EditDealDto, { priceVnd: null }))).length,
    ).toBeGreaterThan(0);
  });

  it('allows null to clear optional Zalo and expiry', async () => {
    expect(await validate(plainToInstance(EditSpaDto, { zalo: null }))).toEqual(
      [],
    );
    expect(
      await validate(plainToInstance(EditDealDto, { endAt: null })),
    ).toEqual([]);
  });

  it('validates route IDs without rejecting legacy demo UUIDs', () => {
    const uuid = new UuidPipe();
    const integer = new PositiveIntPipe();
    expect(uuid.transform('11111111-1111-1111-1111-111111111111')).toBe(
      '11111111-1111-1111-1111-111111111111',
    );
    expect(() => uuid.transform('not-an-id')).toThrow();
    expect(integer.transform('42')).toBe(42);
    for (const value of ['0', '-1', '1.5', '1e2', 'abc', '9007199254740992']) {
      expect(() => integer.transform(value)).toThrow();
    }
  });

  it('rejects invalid booking voucher IDs', async () => {
    for (const dealId of [0, -1, null]) {
      const booking = plainToInstance(BookingDto, {
        spaId: '11111111-1111-1111-1111-111111111111',
        scheduledAt: '2030-01-01T10:00:00Z',
        dealId,
      });
      expect(
        (await validate(booking)).map((error) => error.property),
      ).toContain('dealId');
    }
  });
});
