import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.services';
import { UsersService } from '../users/user.services';

describe('AuthService', () => {
  const signMock = jest.fn(() => 'signed-token');
  const jwtService = {
    sign: signMock,
  } as unknown as JwtService;

  const makeService = (findByEmail: jest.Mock) =>
    new AuthService(
      {
        findByEmail,
      } as unknown as UsersService,
      jwtService,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('selects password for validation and returns a token without the password', async () => {
    const hashedPassword = await bcrypt.hash('secret123', 10);
    const service = makeService(
      jest.fn().mockResolvedValue({
        id: 'user-id',
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'Admin',
        department: null,
        phone: null,
        status: 'Active',
        leads: 0,
      }),
    );

    const result = await service.login('admin@example.com', 'secret123');

    expect(result).toEqual({
      access_token: 'signed-token',
      user: {
        id: 'user-id',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'Admin',
        department: null,
        phone: null,
        status: 'Active',
        leads: 0,
      },
    });
    expect(signMock).toHaveBeenCalledWith({
      sub: 'user-id',
      email: 'admin@example.com',
      role: 'Admin',
      name: 'Admin User',
    });
  });

  it('rejects invalid credentials', async () => {
    const hashedPassword = await bcrypt.hash('secret123', 10);
    const service = makeService(
      jest.fn().mockResolvedValue({
        password: hashedPassword,
      }),
    );

    await expect(
      service.login('admin@example.com', 'wrong-pass'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
