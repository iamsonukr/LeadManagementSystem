import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsIn,
  IsMongoId,
} from 'class-validator';

import { Type } from 'class-transformer';

const CALL_STATUSES = [
  'Connected',
  'Not Answered',
  'Callback Scheduled',
  'Dropped',
] as const;

const CALL_DIRECTIONS = ['Outgoing', 'Incoming'] as const;

export class CreateCallLogDto {
  @ApiProperty({
    description: 'Lead ObjectId',
  })
  @IsMongoId()
  lead!: string;

  @ApiPropertyOptional({
    enum: CALL_STATUSES,
  })
  @IsOptional()
  @IsIn(CALL_STATUSES)
  status?: string;

  @ApiPropertyOptional({
    enum: CALL_DIRECTIONS,
  })
  @IsOptional()
  @IsIn(CALL_DIRECTIONS)
  direction?: string;

  @ApiPropertyOptional({
    description: 'Duration in minutes',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  discussionPoints?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nextAction?: string;

  @ApiProperty({
    example: '2026-05-01T10:00:00Z',
  })
  @IsDateString()
  callDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  callbackDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  calledBy?: string;
}

export class UpdateCallLogDto extends PartialType(CreateCallLogDto) {}

export class UpdateCallStatusDto {
  @ApiProperty({
    enum: CALL_STATUSES,
  })
  @IsIn(CALL_STATUSES)
  status?: string;
}

export class CallLogFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  lead?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  direction?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  calledBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
