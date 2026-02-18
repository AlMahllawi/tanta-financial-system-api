import { SetMetadata } from '@nestjs/common';

export const ALLOW_SELF_KEY = 'allowSelf';
export const AllowSelf = (paramName: string = 'id') =>
  SetMetadata(ALLOW_SELF_KEY, paramName);
