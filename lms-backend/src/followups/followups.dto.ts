import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';

export const FOLLOWUP_STATUS = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
  'On Hold',
  'Duplicate',
  'Spam',
] as const;

export type FollowUpStatus = (typeof FOLLOWUP_STATUS)[number];

export class CreateFollowUpDto {
  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  lead!: string; // ObjectId

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['Demo', 'Proposal', 'Call', 'Email', 'Meeting'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['Pending', 'Completed', 'Overdue', 'Rescheduled'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['Low', 'Medium', 'High'])
  priority?: string;

  @ApiProperty()
  @IsDateString()
  dueAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nextAction?: string;
}

export class UpdateFollowUpDto extends PartialType(CreateFollowUpDto) {}

export class UpdateFollowUpStatusDto {
  @ApiProperty({ enum: FOLLOWUP_STATUS })
  @IsIn(FOLLOWUP_STATUS)
  status!: string;
}

import { IsNumber } from 'class-validator';

export class FollowUpFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  lead?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}
