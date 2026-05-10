import { PartialType } from '@nestjs/swagger';

import {
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// =========================================
// Create User DTO
// =========================================

export class CreateUserDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsIn(['Admin', 'Sales Manager', 'Sales Executive'])
  role?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsIn(['Full-time', 'Part-time', 'Contract', 'Intern'])
  employmentType?: string;

  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @IsOptional()
  @IsString()
  workLocation?: string;

  @IsOptional()
  @IsString()
  reportingManager?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  currentProject?: string;

  @IsOptional()
  @IsIn(['Active', 'Inactive', 'On Leave', 'Resigned'])
  status?: string;
}

// =========================================
// Update User DTO
// =========================================

export class UpdateUserDto extends PartialType(CreateUserDto) {}

// =========================================
// Change Password DTO
// =========================================

export class ChangePasswordDto {
  @MinLength(6)
  @IsString()
  password!: string;
}
