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
  return env;
}
