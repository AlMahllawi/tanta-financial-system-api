import { applyDecorators } from '@nestjs/common';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { NAME_REGEX } from '../constants/regex.constants';

export function IsName() {
  return applyDecorators(
    IsString(),
    MinLength(5, { message: 'Too short name' }),
    MaxLength(255, { message: 'Too long name' }),
    Matches(NAME_REGEX),
  );
}
