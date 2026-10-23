import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetGameResourcesDto {
  @IsString()
  @IsNotEmpty()
  operatorID!: string;

  @IsString()
  @IsNotEmpty()
  gameID!: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  env?: string;
}
