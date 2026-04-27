import { applyDecorators } from '@nestjs/common';
import {
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidationArguments,
} from 'class-validator';

import { NAME_REGEX } from '../constants/regex.constants.js';

const toLowerSpaceCase = (camelCase: string) =>
  camelCase.replace(/([A-Z])/g, ' $1').toLowerCase();

export function IsName() {
  return applyDecorators(
    IsString(),
    MinLength(5, {
      message: (args: ValidationArguments) =>
        `Too short ${toLowerSpaceCase(args.property)}`,
    }),
    MaxLength(255, {
      message: (args: ValidationArguments) =>
        `Too long ${toLowerSpaceCase(args.property)}`,
    }),
    Matches(NAME_REGEX),
  );
}
