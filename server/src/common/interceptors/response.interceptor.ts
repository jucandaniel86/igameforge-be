import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator.js';
import { Reflector } from '@nestjs/core';

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ResponseWithMessage<T> {
  __apiResponse: true;
  data: T;
  message: string;
}

export function withMessage<T>(
  data: T,
  message: string,
): ResponseWithMessage<T> {
  return {
    __apiResponse: true,
    data,
    message,
  };
}

function isResponseWithMessage(
  value: unknown,
): value is ResponseWithMessage<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__apiResponse' in value &&
    value.__apiResponse === true
  );
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,

    next: CallHandler,
  ): Observable<unknown> {
    const skipTransform = this.reflector.getAllAndOverride<boolean>(
      SKIP_TRANSFORM_KEY,
      [context.getHandler(), context.getClass()],
    );
    // Returnăm răspunsul original, fără transformare
    if (skipTransform) {
      return next.handle();
    }

    return next.handle().pipe(
      map((result: unknown) => {
        if (isResponseWithMessage(result)) {
          return {
            success: true as const,
            data: result.data,
            message: result.message,
          };
        }

        return {
          success: true as const,
          data: result,
        };
      }),
    );
  }
}
