import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose/dist/common/mongoose.decorators';
import { Model, Types } from 'mongoose';
import { TeamMember, TeamMemberDocument } from './teamMember.entity';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './teamMember.dto';

@Injectable()
export class TeamMemberServices {
  constructor(
    @InjectModel(TeamMember.name)
    private teamMemberModel: Model<TeamMemberDocument>,
  ) {}

  private assertObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid team member id');
    }
  }

  findAll() {
    return this.teamMemberModel.find().sort({ createdAt: -1 }).exec();
  }

  async findById(id: string) {
    this.assertObjectId(id);
    const member = await this.teamMemberModel.findById(id).exec();
    if (!member) {
      throw new NotFoundException('Team member not found');
    }
    return member;
  }

  async create(dto: CreateTeamMemberDto) {
    const existing = await this.teamMemberModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const newMember = new this.teamMemberModel(dto);
    return newMember.save();
  }

  async update(id: string, dto: UpdateTeamMemberDto) {
    this.assertObjectId(id);
    const member = await this.teamMemberModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    return member;
  }

  async toggleStatus(id: string, dto: UpdateTeamMemberDto) {
    this.assertObjectId(id);
    const member = await this.teamMemberModel.findById(id).exec();
    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (dto.status) {
      member.status = dto.status;
    }

    return member.save();
  }
}
