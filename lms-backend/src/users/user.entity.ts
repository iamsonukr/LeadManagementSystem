import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Exclude } from 'class-transformer';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // createdAt & updatedAt
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: true, select: false })
  @Exclude()
  password!: string;

  @Prop({
    default: 'Sales Executive',
    enum: ['Admin', 'Sales Manager', 'Sales Executive'],
  })
  role!: string;

  @Prop({ type: String, default: null })
  department: string | null = null;

  @Prop({ type: String, default: null })
  phone: string | null = null;

  @Prop({ default: 'Active', enum: ['Active', 'Inactive'] })
  status!: string;

  @Prop({ default: 0 })
  leads: number = 0;
}

export const UserSchema = SchemaFactory.createForClass(User);
