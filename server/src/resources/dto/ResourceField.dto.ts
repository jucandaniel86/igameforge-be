import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class ResourcesFieldDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsDefined()
  @IsString()
  @Matches(/^[1-9]\d*$/)
  field_id!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  game_id!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  operator_id!: string;
}
