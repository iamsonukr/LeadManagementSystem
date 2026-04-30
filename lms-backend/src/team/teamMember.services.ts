import { Body, ConflictException, Injectable, Param } from '@nestjs/common';
import { TeamMember, TeamMemberDocument } from './teamMember.entity';
import { InjectModel } from '@nestjs/mongoose/dist/common/mongoose.decorators';
import { Model } from 'mongoose';
import { UpdateTeamMemberDto } from './teamMember.dto';

@Injectable()
export class TeamMemberServices {
  constructor(
    @InjectModel(TeamMember.name)
    private teamMemberModel: Model<TeamMemberDocument>,
  ) {}

  //   Find all team members
  findAll() {
    return {
      teamMembers: this.teamMemberModel.find().exec(),
    };
  }

  // Find a team member by ID
  findById(id: string) {
    return this.teamMemberModel.findById(id).exec();
  }

  // Create a new team member
  async create(dto: any) {
    const existing = await this.teamMemberModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const newMember = new this.teamMemberModel(dto);
    return newMember.save();
  }

  update(id: string, dto: UpdateTeamMemberDto) {
    return this.teamMemberModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
  }

  toggleStatus(id: string, dto: UpdateTeamMemberDto) {
    return this.teamMemberModel
      .findById(id)
      .exec()
      .then((member) => {
        if (!member) {
          throw new Error('Team member not found');
        }
        member.status = dto.status || member.status; // Update status if provided
        return member.save();
      });
  }
}
