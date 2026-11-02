import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class SaveOperatorFieldDto {
  @IsString()
  @IsNotEmpty()
  operatorID!: string;

  @IsString()
  @IsNotEmpty()
  fieldKey!: string;

  @IsString()
  @IsNotEmpty()
  fieldType!: string;

  @IsString()
  @IsNotEmpty()
  fieldLabel!: string;

  @IsOptional()
  @IsString()
  fieldValues?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  gameResourceTypeId?: number;

  @IsOptional()
  @IsString()
  extraOptions?: string | null;
}
