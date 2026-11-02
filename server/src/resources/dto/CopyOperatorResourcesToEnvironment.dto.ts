import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsString,
  ValidateIf,
  registerDecorator,
  ValidationArguments,
} from 'class-validator';

import { Environment } from '../../generated/prisma/enums.js';

// Echivalent pentru Laravel: different:fromEnvironmentID
function IsDifferentFrom(property: string) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDifferentFrom',
      target: object.constructor,
      propertyName,
      constraints: [property],
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const otherValue = (args.object as Record<string, unknown>)[
            args.constraints[0]
          ];

          return value !== otherValue;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be different from ${args.constraints[0]}`;
        },
      },
    });
  };
}

export class CopyOperatorResourcesToEnvironmentDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  operatorID!: string;

  @IsDefined()
  @IsEnum(Environment)
  fromEnvironmentID!: Environment;

  @Transform(({ value, obj }) =>
    value === undefined ? obj.toEnvironmentID : value,
  )
  @IsDefined()
  @IsEnum(Environment)
  @IsDifferentFrom('fromEnvironmentID')
  toEnvironment!: Environment;

  @ValidateIf(() => false)
  toEnvironmentID?: Environment;

  @Transform(({ value }) => (typeof value === 'number' ? String(value) : value))
  @IsDefined()
  @IsIn(['0', '1'])
  overwriteDuplicates!: '0' | '1';
}
