import { PartialType } from '@nestjs/swagger';

import { IsIn, IsOptional, IsString } from 'class-validator';

// =========================================
// Create Department DTO
// =========================================

export class CreateDepartmentDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: string;
}

// =========================================
// Update Department DTO
// =========================================

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
