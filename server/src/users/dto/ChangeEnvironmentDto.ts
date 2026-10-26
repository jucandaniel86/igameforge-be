import { IsEnum } from 'class-validator';
import { Environment } from '../../generated/prisma/enums.js';

export class ChangeEnvironmentDto {
  @IsEnum(Environment)
  env!: Environment;
}
