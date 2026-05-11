import { UsersService } from './../users/user.services';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string | null;
  phone?: string | null;
  status?: string;
  leads?: number;
}

type AuthLookupUser = {
  id?: string;
  _id?: unknown;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  password: string;
  role: string;
  department?: unknown;
  phone?: string | null;
  status?: string;
  leads?: number;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private getDepartmentName(department: unknown): string | null {
    if (!department) return null;

    if (typeof department === 'string') {
      return department;
    }

    if (typeof department === 'object' && 'name' in department) {
      return String(
        (
          department as {
            name?: string;
          }
        ).name ?? '',
      );
    }

    return null;
  }

  private getUserId(user: AuthLookupUser): string {
    if (user.id) {
      return user.id;
    }

    if (typeof user._id === 'string') {
      return user._id;
    }

    if (user._id instanceof Types.ObjectId) {
      return user._id.toString();
    }

    return '';
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const user = (await this.usersService.findByEmail(
      email,
      true,
    )) as AuthLookupUser | null;
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const displayName =
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
      (user as typeof user & { name?: string }).name ||
      user.email;
    const id = this.getUserId(user);

    return {
      id,
      name: displayName,
      email: user.email,
      role: user.role,
      department: this.getDepartmentName(user.department),
      phone: user.phone,
      status: user.status,
      leads: user.leads,
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
