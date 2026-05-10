import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './user.controller';
import { UsersService } from './user.services';
import { User, UserSchema } from './user.entity';
import { Department, DepartmentSchema } from '../department/department.entity';
import { Lead, LeadSchema } from '../leads/leads.entity';
import { Project, ProjectSchema } from '../projects/projects.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
