import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class DealLookupParamPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const normalized = value.trim();

    if (!normalized) {
      throw new BadRequestException('Invalid deal identifier');
    }

    if (/^-?\d+$/.test(normalized) && !/^[1-9]\d*$/.test(normalized)) {
      throw new BadRequestException('Deal ID must be a positive integer');
    }

    return normalized;
  }
}
