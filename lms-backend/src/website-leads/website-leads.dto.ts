import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CustomFieldMappingDto {
  @ApiProperty({ example: 'course_interest' })
  @IsString()
  websiteField!: string;

  @ApiProperty({ example: 'metadata.courseInterest' })
  @IsString()
  lmsField!: string;

  @ApiProperty({ example: 'Course Interest' })
  @IsString()
  label!: string;
}

export class CreateWebsiteSourceDto {
  @ApiProperty({ example: 'Yoga and Fitness Website' })
  @IsString()
  name!: string;

  @ApiProperty({ example: ['yogafitness.com', 'www.yogafitness.com'] })
  @IsArray()
  @IsString({ each: true })
  allowedDomains!: string[];

  @ApiPropertyOptional({ example: 'full_name' })
  @IsOptional()
  @IsString()
  nameField?: string;

  @ApiPropertyOptional({ example: 'email_address' })
  @IsOptional()
  @IsString()
  emailField?: string;

  @ApiPropertyOptional({ example: 'mobile' })
  @IsOptional()
  @IsString()
  phoneField?: string;

  @ApiPropertyOptional({ example: 'enquiry' })
  @IsOptional()
  @IsString()
  messageField?: string;

  @ApiPropertyOptional({ type: [CustomFieldMappingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldMappingDto)
  customFields?: CustomFieldMappingDto[];

  @ApiPropertyOptional({ example: 'Website Enquiry' })
  @IsOptional()
  @IsString()
  leadSource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  acceptUnknownDomains?: boolean;
}

export class UpdateWebsiteSourceDto extends PartialType(CreateWebsiteSourceDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// What external websites POST to /website-leads/:sourceId/submit
export class SubmitLeadDto {
  // Standard fields (names may vary — mapped via source config)
  [key: string]: unknown;
}
