import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, CookieOptions } from 'express';
import { AuthOriginGuard } from './guards/auth-origin.guard.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: this.config.get<'lax' | 'strict' | 'none'>(
        'JWT_REFRESH_COOKIE_SAME_SITE',
        'lax',
      ),
      path: '/api/auth',
    };
  }

  private refreshCookie(request: Request): string | undefined {
    const value = request.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('refresh_token='))
      ?.slice('refresh_token='.length);
    try {
      return value ? decodeURIComponent(value) : undefined;
    } catch {
      return undefined;
    }
  }

  private tokenResponse(
    tokens: Awaited<ReturnType<AuthService['login']>>,
    response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    response.cookie('refresh_token', tokens.refreshToken, {
      ...this.cookieOptions(),
      expires: tokens.expiresAt,
    });
    return { access_token: tokens.access_token };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user.sub);
  }

  @Post('login')
  @UseGuards(AuthOriginGuard)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.tokenResponse(await this.authService.login(dto), response);
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(AuthOriginGuard)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    return this.tokenResponse(
      await this.authService.refresh(this.refreshCookie(request)),
      response,
    );
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(AuthOriginGuard)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    try {
      return await this.authService.logout(this.refreshCookie(request));
    } finally {
      response.clearCookie('refresh_token', this.cookieOptions());
    }
  }
}
