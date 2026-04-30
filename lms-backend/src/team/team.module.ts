import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamMember, TeamMemberSchema } from './teamMember.entity';
import { TeamMemberController } from './teamMember.controller';
import { TeamMemberServices } from './teamMember.services';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TeamMember.name, schema: TeamMemberSchema },
    ]),
  ],
  controllers: [TeamMemberController],
  providers: [TeamMemberServices],
  exports: [TeamMemberServices],
})
export class TeamModule {}
