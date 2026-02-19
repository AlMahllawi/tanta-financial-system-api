import { ExecutionContext, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Request } from 'express';
import { User } from '../../user/entities/user.entity.js';

export const ROLES_EXCEPTION_KEY = 'rolesException';

export type RolesExceptionCondition = (
  user: User,
  request: Request,
  moduleRef: ModuleRef,
  context: ExecutionContext,
) => boolean | Promise<boolean>;

export const RolesException = (condition: RolesExceptionCondition) =>
  SetMetadata(ROLES_EXCEPTION_KEY, condition);
