import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ColumnMappingDto {
  @ApiPropertyOptional({ description: 'Sheet column header for lead name', example: 'Full Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for email', example: 'Email Address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for phone', example: 'Phone Number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for company', example: 'Company Name' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for lead status', example: 'Status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for lead source', example: 'Source' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for services', example: 'Services' })
  @IsOptional()
  @IsString()
  services?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for priority', example: 'Priority' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for assigned user id', example: 'Assigned To' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for department id', example: 'Department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for lead value', example: 'Lead Value' })
  @IsOptional()
  @IsString()
  leadValue?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for stage probability', example: 'Probability' })
  @IsOptional()
  @IsString()
  stageProbability?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for expected close date', example: 'Expected Close Date' })
  @IsOptional()
  @IsString()
  expectedCloseDate?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for last activity date', example: 'Last Activity' })
  @IsOptional()
  @IsString()
  lastActivityAt?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for last contacted date', example: 'Last Contacted' })
  @IsOptional()
  @IsString()
  lastContactedAt?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for next action', example: 'Next Action' })
  @IsOptional()
  @IsString()
  nextAction?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for location', example: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for industry', example: 'Industry' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for company size', example: 'Company Size' })
  @IsOptional()
  @IsString()
  companySize?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for budget', example: 'Budget' })
  @IsOptional()
  @IsString()
  budget?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for currency', example: 'Currency' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for address JSON', example: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for tags', example: 'Tags' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for AI score', example: 'AI Score' })
  @IsOptional()
  @IsString()
  aiScore?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for metadata JSON', example: 'Metadata' })
  @IsOptional()
  @IsString()
  metadata?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for call count', example: 'Call Count' })
  @IsOptional()
  @IsString()
  callCount?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for last call date', example: 'Last Call' })
  @IsOptional()
  @IsString()
  lastCallDate?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for next follow-up date', example: 'Next Follow Up' })
  @IsOptional()
  @IsString()
  nextFollowUp?: string;

  @ApiPropertyOptional({ description: 'Sheet column header for notes', example: 'Message' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Legacy sheet column header for message/notes', example: 'Message' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class CreateMetaAdsCampaignDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  clientName!: string;

  @ApiProperty({ example: 'Summer 2025 Leads' })
  @IsString()
  campaignName!: string;

  @ApiPropertyOptional({ example: 'https://docs.meta.com/spreadsheets/d/...' })
  @IsOptional()
  @IsString()
  sheetUrl?: string;

  @ApiPropertyOptional({ example: 'https://docs.meta.com/spreadsheets/d/...' })
  @IsOptional()
  @IsString()
  sheetLink?: string;

  @ApiPropertyOptional({ example: 'https://docs.meta.com/forms/d/...' })
  @IsOptional()
  @IsString()
  formLink?: string;

  @ApiPropertyOptional({ example: 'Meta Ads' })
  @IsOptional()
  @IsString()
  leadSource?: string;

  @ApiPropertyOptional({ type: ColumnMappingDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ColumnMappingDto)
  columnMapping?: ColumnMappingDto;
}

export class UpdateMetaAdsCampaignDto extends PartialType(CreateMetaAdsCampaignDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SyncQueryDto {
  @ApiPropertyOptional({ default: 200 })
  @IsOptional()
  limit?: number;
}
