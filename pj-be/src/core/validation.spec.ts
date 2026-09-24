import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './auth';
import { ReviewDto } from './member';
import { DealDto } from './owner';

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
});
