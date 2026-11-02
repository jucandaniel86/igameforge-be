import { Type } from 'class-transformer';
import { IsDefined, IsInt, IsOptional, IsString } from 'class-validator';

export class GameSettingFieldDto {
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  game_resources_field_id!: number;

  @IsString()
  @IsOptional()
  field_value?: string;
}
