import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TeamMemberDocument = TeamMember & Document;

@Schema({ timestamps: true, collection: 'team_members' }) // createdAt & updatedAt
export class TeamMember {
  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  employeeId?: string;

  @Prop({ required: true })
  role!: string;

  @Prop({ required: true })
  department!: string;

  @Prop({ enum: ['Full-time', 'Part-time', 'Contract', 'Intern'], default: 'Full-time' })
  employmentType!: string;

  @Prop({ required: true })
  joiningDate!: string;

  @Prop({ trim: true })
  workLocation?: string;

  @Prop({ trim: true })
  reportingManager?: string;

  @Prop({ type: [String], default: [] })
  skills?: string[];

  @Prop({ required: true, type: String })
  currentProject!: string;

  @Prop({
    default: 'Active',
    enum: ['Active', 'Inactive', 'On Leave', 'Resigned'],
  })
  status!: string;
}

export const TeamMemberSchema = SchemaFactory.createForClass(TeamMember);
