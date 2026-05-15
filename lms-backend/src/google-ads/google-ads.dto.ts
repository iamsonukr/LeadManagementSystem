import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
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

  @ApiPropertyOptional({ description: 'Sheet column header for message/notes', example: 'Message' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class CreateGoogleAdsCampaignDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  clientName!: string;

  @ApiProperty({ example: 'Summer 2025 Leads' })
  @IsString()
  campaignName!: string;

  @ApiProperty({ example: 'https://docs.google.com/spreadsheets/d/...' })
  @IsString()
  sheetUrl!: string;

  @ApiPropertyOptional({ example: 'Google Ads' })
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

export class UpdateGoogleAdsCampaignDto extends PartialType(CreateGoogleAdsCampaignDto) {
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
