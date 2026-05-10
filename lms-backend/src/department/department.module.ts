import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { Department, DepartmentSchema } from './department.entity';

import { DepartmentController } from './department.controller';

import { DepartmentService } from './department.services';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Department.name,
        schema: DepartmentSchema,
      },
    ]),
  ],

  controllers: [DepartmentController],

  providers: [DepartmentService],

  exports: [DepartmentService],
})
export class DepartmentModule {}
