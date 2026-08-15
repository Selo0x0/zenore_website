import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { Prisma } from '@zenore/db';

@Injectable()
export class ParseJsonObjectPipe implements PipeTransform {
  transform(value: unknown): Prisma.InputJsonValue {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new BadRequestException('Request body must be a JSON object.');
    }
    return value;
  }
}
