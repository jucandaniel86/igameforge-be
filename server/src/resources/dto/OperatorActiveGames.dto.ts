import { IsEnum, Min, IsString, IsNotEmpty, Matches } from 'class-validator';
import { Environment } from '../../generated/prisma/enums.js';

export class OperatorActiveGamesDto {
  @IsString()
  @IsNotEmpty()
  operatorID!: string;

  @IsNotEmpty()
  @IsEnum(Environment)
  env!: Environment;

  @IsString()
  @Matches(/^[1-9]\d*$/, {
    message: 'game_id must be a positive integer',
  })
  gameID!: string;
}
