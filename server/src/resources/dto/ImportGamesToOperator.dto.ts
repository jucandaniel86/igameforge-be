import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Environment } from '../../generated/prisma/enums.js';

export class ImportGamesToOperatorDto {
  @IsNotEmpty()
  @IsString()
  operatorID!: string;

  @IsNotEmpty()
  @IsString()
  games!: string;

  @IsEnum(Environment)
  env!: Environment;
}
