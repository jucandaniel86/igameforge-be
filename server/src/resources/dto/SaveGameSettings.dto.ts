import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { GameSettingFieldDto } from './GameSettingField.dto.js';

export class SaveGameSettingsDto {
  @IsDefined()
  @IsNotEmpty()
  game_id!: string;

  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GameSettingFieldDto)
  fields!: GameSettingFieldDto[];

  @IsOptional()
  @IsString()
  language?: string;
}
