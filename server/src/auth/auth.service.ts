import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import { durationSeconds } from './auth.config.js';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
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

    const id = randomUUID();
    const expiresAt = new Date(
      Date.now() +
        durationSeconds(
          this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
        ) *
          1000,
    );
    const tokens = await this.issueTokens(user, id, expiresAt);
    await this.prisma.authSession.create({
      data: {
        id,
        userId: user.id,
        tokenHash: this.hash(tokens.refreshToken),
        expiresAt,
      },
    });
    return tokens;
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(
    user: { id: bigint; email: string; env: string | null; userType: string },
    sessionId: string,
    expiresAt: Date,
  ) {
    const seconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    if (seconds < 1) throw new UnauthorizedException('Refresh session expired');
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({
        sub: user.id.toString(),
        email: user.email,
        env: user.env,
        userType: user.userType,
      }),
      this.jwtService.signAsync(
        {
          sub: user.id.toString(),
          sid: sessionId,
          jti: randomUUID(),
          type: 'refresh',
        },
        {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
          algorithm: 'HS256',
          expiresIn: seconds,
        },
      ),
    ]);
    return { access_token: accessToken, refreshToken, expiresAt };
  }

  private async verifyRefresh(
    token: string | undefined,
    ignoreExpiration = false,
  ) {
    if (!token) throw new UnauthorizedException('Refresh token required');
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        sid: string;
        jti: string;
        type: string;
      }>(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        algorithms: ['HS256'],
        ignoreExpiration,
      });
      if (
        payload.type !== 'refresh' ||
        typeof payload.sub !== 'string' ||
        !/^\d+$/.test(payload.sub) ||
        typeof payload.sid !== 'string' ||
        typeof payload.jti !== 'string'
      )
        throw new Error('Invalid refresh payload');
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async refresh(token: string | undefined) {
    const payload = await this.verifyRefresh(token);
    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
      include: {
        user: { select: { id: true, email: true, env: true, userType: true } },
      },
    });
    const now = new Date();
    if (
      !session ||
      session.userId.toString() !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= now
    )
      throw new UnauthorizedException('Refresh session inactive');

    if (session.tokenHash !== this.hash(token!)) {
      await this.revokeSession(session.id, session.userId);
      throw new UnauthorizedException('Refresh token reused');
    }
    const tokens = await this.issueTokens(
      session.user,
      session.id,
      session.expiresAt,
    );
    // Compare-and-swap makes rotation atomic even across multiple server instances.
    const rotated = await this.prisma.authSession.updateMany({
      where: {
        id: session.id,
        tokenHash: session.tokenHash,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { tokenHash: this.hash(tokens.refreshToken) },
    });
    if (rotated.count !== 1) {
      await this.revokeSession(session.id, session.userId);
      throw new UnauthorizedException('Refresh token already consumed');
    }
    return tokens;
  }

  private revokeSession(id: string, userId: bigint) {
    return this.prisma.authSession.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logout(token: string | undefined) {
    // A correctly signed expired token can still identify the session for logout.
    let payload;
    try {
      payload = await this.verifyRefresh(token, true);
    } catch {
      return { message: 'Logged out' };
    }
    await this.revokeSession(payload.sid, BigInt(payload.sub));
    return { message: 'Logged out' };
  }
}
