import { ExecutionContext, SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../user/entities/user.entity.js';

export const ROLES_EXCEPTION_KEY = 'rolesException';

export type RolesExceptionCondition = (
  user: User,
  request: Request,
  context: ExecutionContext,
) => boolean;

export const RolesException = (condition: RolesExceptionCondition) =>
  SetMetadata(ROLES_EXCEPTION_KEY, condition);
