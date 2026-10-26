import { IsArray, IsString, IsNotEmpty, ArrayNotEmpty } from 'class-validator';
import { Environment } from '../../generated/prisma/enums.js';

export class EnvironmentsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  envs!: Environment[];

  @IsString()
  @IsNotEmpty()
  defaultEnv!: Environment;
}
