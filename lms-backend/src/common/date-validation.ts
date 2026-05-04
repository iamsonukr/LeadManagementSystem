import { BadRequestException } from '@nestjs/common';

export function assertDateIsTodayOrFuture(value: unknown, label: string) {
  if (value === undefined || value === null || value === '') {
    return;
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${label} must be a valid date`);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date.getTime() < today.getTime()) {
    throw new BadRequestException(`${label} cannot be in the past`);
  }
}
