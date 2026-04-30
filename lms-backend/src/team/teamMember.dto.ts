import { PartialType } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class CreateTeamMemberDto {
  @IsString()
  fullName: string;

  @IsString()
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
