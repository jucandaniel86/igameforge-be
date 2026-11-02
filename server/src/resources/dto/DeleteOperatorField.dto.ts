import { Type } from 'class-transformer';
import { IsInt, IsDefined, Min } from 'class-validator';

export class DeleteOperatorField {
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fieldID!: string;
}
