import { Type } from 'class-transformer';
import { IsOptional, IsString, Matches } from 'class-validator';

export class GameResourceTypes {
  @IsString()
  @Matches(/^[1-9]\d*$/, {
    message: 'game_id must be a positive integer',
  })
  game_id!: string;

  @IsOptional()
  @IsString()
  language?: string;
}
