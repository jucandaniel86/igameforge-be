import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Environment } from '../../generated/prisma/enums.js';

export class GameApiRespourcesDto {
  @IsNotEmpty()
  @IsString()
  operatorID!: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEnum(Environment)
  env?: Environment;

  @IsOptional()
  @IsString()
  gameID?: string;
}
