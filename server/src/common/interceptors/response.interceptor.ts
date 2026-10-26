import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<unknown>> {
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
