import { IsEnum } from 'class-validator';
import { Environment } from '../../generated/prisma/enums.js';

export class SyncForgeDto {
  @IsEnum(Environment)
  env!: Environment;
}
