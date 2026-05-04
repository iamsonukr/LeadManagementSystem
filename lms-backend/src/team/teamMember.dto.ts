import { PartialType } from '@nestjs/swagger';
import { IsArray, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateTeamMemberDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsString()
  role: string;

  @IsString()
  department: string;

  @IsOptional()
  @IsIn(['Full-time', 'Part-time', 'Contract', 'Intern'])
  employmentType?: string;

  @IsString()
  joiningDate: string;

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

  @IsString()
  currentProject: string;

  @IsIn(['Active', 'Inactive', 'On Leave', 'Resigned'])
  status: string;
}

export class UpdateTeamMemberDto extends PartialType(CreateTeamMemberDto) {}
