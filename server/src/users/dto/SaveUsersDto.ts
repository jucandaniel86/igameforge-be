import { Type, Exclude } from 'class-transformer';

import {
  IsNotEmpty,
  MaxLength,
  IsString,
  Min,
  IsEmail,
  IsDefined,
  IsInt,
  IsOptional,
  ValidateNested,
  IsEnum,
} from 'class-validator';

import { EnvironmentsDto } from './EnvironmentsDto.js';
import { UserType } from '../../generated/prisma/enums.js';

export class SaveUsersDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  password?: string;

  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  id!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  provider_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  site_id?: string | null;

  @IsOptional()
  @IsEnum(UserType)
  user_type?: UserType | null;

  @IsOptional()
  @IsString()
  roles?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => EnvironmentsDto)
  environments?: EnvironmentsDto;
}
