import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './user.entity';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll() {
    return this.userModel.find().sort({ createdAt: -1 }).select('-password'); // exclude password
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password');

    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = new this.userModel({
      ...dto,
      password: hashed,
    });

    return user.save();
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        dto,
        { new: true }, // return updated doc
      )
      .select('-password');

    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const hashed = await bcrypt.hash(dto.password, 10);
    user.password = hashed;

    await user.save();

    return { message: 'Password updated' };
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);

    if (!user) throw new NotFoundException(`User ${id} not found`);

    return { message: 'User deleted' };
  }
}
