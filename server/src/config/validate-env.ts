import { plainToInstance, Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

class Environment {
  @IsString()
  @Matches(/^mysql:\/\//)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET!: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @Matches(/^[1-9]\d*(s|m|h|d)$/)
  JWT_ACCESS_EXPIRES_IN = '30m';

  @IsString()
  @Matches(/^[1-9]\d*(s|m|h|d)$/)
  JWT_REFRESH_EXPIRES_IN = '7d';

  @IsString()
  @Matches(/^(lax|strict|none)$/)
  JWT_REFRESH_COOKIE_SAME_SITE = 'lax';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3001;

  @IsString()
  @MinLength(1)
  CORS_ORIGINS = 'http://localhost:3000';
}

export function validateEnv(config: Record<string, unknown>): Environment {
  const env = plainToInstance(Environment, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length) {
    // Report field names only, never environment values.
    throw new Error(
      `Invalid environment configuration: ${errors.map((error) => error.property).join(', ')}`,
    );
  }
  if (env.JWT_REFRESH_SECRET === env.JWT_SECRET) {
    throw new Error('JWT_REFRESH_SECRET must differ from JWT_SECRET');
  }
  if (
    env.JWT_REFRESH_COOKIE_SAME_SITE === 'none' &&
    config.NODE_ENV !== 'production'
  ) {
    throw new Error('SameSite=None requires production HTTPS cookies');
  }
  return env;
}
