import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsDefined,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateRoleDto {
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  id!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  guard_name?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  guardName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @IsOptional()
  @IsDateString()
  createdAt?: string | null;

  @IsOptional()
  @IsDateString()
  updatedAt?: string | null;
}
