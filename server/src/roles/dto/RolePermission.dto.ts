import { Type } from 'class-transformer';
import { IsInt, IsDefined, Min } from 'class-validator';

export class RolePermissionDto {
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  role_id!: number;
}
