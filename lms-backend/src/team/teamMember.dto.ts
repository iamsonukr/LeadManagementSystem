import { PartialType } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString } from 'class-validator';

export class CreateTeamMemberDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  role: string;

  @IsString()
  department: string;

  @IsString()
  joiningDate: string;

  @IsString()
  currentProject: string;

  @IsIn(['Active', 'Inactive', 'On Leave', 'Resigned'])
  status: string;
}

export class UpdateTeamMemberDto extends PartialType(CreateTeamMemberDto) {}
