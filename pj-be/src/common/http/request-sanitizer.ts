import { BadRequestException } from '@nestjs/common';

export function assertNoNullBytes(url: string): void {
  if (url.includes('\0') || /%00/i.test(url)) {
    throw new BadRequestException('Malformed request path');
  }
}
