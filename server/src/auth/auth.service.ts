import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async me(userId: string) {
    if (typeof userId !== 'string' || !/^\d+$/.test(userId)) {
      throw new UnauthorizedException('Invalid user');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        env: true,
        allowedEnvs: true,
        userType: true,
        siteId: true,
        provider: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
                permissions: {
                  select: {
                    permission: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const { roles: userRoles, ...userData } = user;

    return {
      user: userData,
      roles: [...new Set(userRoles.map(({ role }) => role.name))],
      permissions: [
        ...new Set(
          userRoles.flatMap(({ role }) =>
            role.permissions.map(({ permission }) => permission.name),
          ),
        ),
      ],
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const hash = user.password.startsWith('$2y$')
      ? `$2b$${user.password.slice(4)}`
      : user.password;

    const passwordMatches = await bcrypt.compare(dto.password, hash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id.toString(),
      email: user.email,
      env: user.env,
      userType: user.userType,
    });

    return {
      access_token: accessToken,
    };
  }
}
