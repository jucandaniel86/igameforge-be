import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BigIntInterceptor } from './interceptors/bigint.interceptor.js';
import { ResponseInterceptor } from './interceptors/response.interceptor.js';

export function setupApp(app: INestApplication): void {
  const origins = app
    .get(ConfigService)
    .getOrThrow<string>('CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new BigIntInterceptor(), new ResponseInterceptor());
  app.enableShutdownHooks();
}
