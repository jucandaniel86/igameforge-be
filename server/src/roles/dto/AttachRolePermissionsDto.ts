import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsNumberString,
  ArrayNotEmpty,
} from 'class-validator';

export class AttachRolePermissionsDto {
  @IsDefined()
  @IsNumberString({ no_symbols: true })
  role_id!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumberString({ no_symbols: true }, { each: true })
  permission_ids!: string[];
}
