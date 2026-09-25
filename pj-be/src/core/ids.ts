import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

// PostgreSQL accepts any 128-bit UUID value, including older demo IDs whose
// version and variant bits do not match the stricter class-validator check.
export const POSTGRES_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class UuidPipe implements PipeTransform<string, string> {
  transform(value: string) {
    if (!POSTGRES_UUID.test(value))
      throw new BadRequestException('ID must be a UUID');
    return value;
  }
}

@Injectable()
export class PositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string) {
    const id = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id < 1)
      throw new BadRequestException('ID must be a positive integer');
    return id;
  }
}
