import { applyDecorators, HttpStatus, SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../prisma/generated/enums.js';
import { ApiErrorResponses } from './error.js';
import { ErrorCode } from '../enums/error-codes.enum.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) =>
  applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    ApiErrorResponses({
      status: HttpStatus.FORBIDDEN,
      description: 'Roles restricted resource.',
      errorCode: ErrorCode.MISSING_ROLE,
      args: { roles: roles.join(' | ') },
    }),
  );
