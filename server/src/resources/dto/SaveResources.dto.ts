import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

import { ResourcesFieldDto } from './ResourceField.dto.js';

export class SaveResourcesDto {
  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ResourcesFieldDto)
  fields!: ResourcesFieldDto[];

  @IsDefined()
  @Transform(({ value }) =>
    typeof value === 'number' || typeof value === 'string'
      ? String(value)
      : value,
  )
  @IsString()
  @Matches(/^[1-9]\d*$/)
  game_id!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  operator_id!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  language!: string;
}
