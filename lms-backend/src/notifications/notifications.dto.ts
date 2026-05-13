import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class NotificationFilterDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
