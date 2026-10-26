import { Type } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';

export class ChangePasswordDto {
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  new_password!: string;

  @IsString()
  @IsNotEmpty()
  new_password_confirmation!: string;
}
