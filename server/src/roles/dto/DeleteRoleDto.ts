import { IsDefined, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
export class DeleteRoleDto {
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  role_id!: number;
}
