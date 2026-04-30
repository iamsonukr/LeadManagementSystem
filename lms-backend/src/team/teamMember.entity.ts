import mongoose, { mongo } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type TeamMemberDocument = TeamMember & Document;

@Schema({ timestamps: true, collection: 'team_members' }) // createdAt & updatedAt
export class TeamMember {
  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: true })
  role!: string;

  @Prop({ required: true })
  department!: string;

  @Prop({ required: true })
  joiningDate!: string;

  @Prop({ required: true, type: String })
  currentProject!: string;

  @Prop({
    default: 'Active',
    enum: ['Active', 'Inactive', 'On Leave', 'Resigned'],
  })
  status!: string;
}

export const TeamMemberSchema = SchemaFactory.createForClass(TeamMember);
