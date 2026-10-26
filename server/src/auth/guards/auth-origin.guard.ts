import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class AuthOriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const origins = this.config
      .getOrThrow<string>('CORS_ORIGINS')
      .split(',')
      .map((value) => value.trim());
    // Custom headers require a CORS preflight; reject untrusted browser origins too.
    if (
      request.get('X-Auth-Request') !== '1' ||
      (request.headers.origin && !origins.includes(request.headers.origin))
    ) {
      throw new ForbiddenException('Untrusted authentication request');
    }
    return true;
  }
}
