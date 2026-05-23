import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateMetaAdsCampaignDto {
  @ApiProperty({ example: 'Yoga and Fitness' })
  @IsString()
  clientName!: string;

  @ApiProperty({ example: 'Summer 2026 Leads' })
  @IsString()
  campaignName!: string;

  @ApiProperty({ example: '100683081627074' })
  @IsString()
  pageId!: string;

  @ApiPropertyOptional({ example: '987654321' })
  @IsOptional()
  @IsString()
  formId?: string;

  @ApiPropertyOptional({ example: 'act_123456789' })
  @IsOptional()
  @IsString()
  adAccountId?: string;

  @ApiPropertyOptional({ example: 'Meta Ads' })
  @IsOptional()
  @IsString()
  leadSource?: string;
}

export class UpdateMetaAdsCampaignDto extends PartialType(CreateMetaAdsCampaignDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
