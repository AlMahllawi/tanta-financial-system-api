import {
  applyDecorators,
  HttpStatus,
  SetMetadata,
  ExecutionContext,
} from '@nestjs/common';
import { UserRole } from '../../../prisma/generated/enums.js';
import { ApiErrorResponses } from '../../common/decorators/api-error.decorator.js';
import { ErrorCode } from '../../common/enums/error-codes.enum.js';
import { ModuleRef } from '@nestjs/core';
import { Request } from 'express';
import { User } from '../../user/entities/user.entity.js';

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

export const ROLES_EXCEPTION_KEY = 'rolesException';

export type RolesExceptionCondition = (
  user: User,
  request: Request,
  moduleRef: ModuleRef,
  context: ExecutionContext,
) => boolean | Promise<boolean>;

export const RolesException = (condition: RolesExceptionCondition) =>
  SetMetadata(ROLES_EXCEPTION_KEY, condition);
