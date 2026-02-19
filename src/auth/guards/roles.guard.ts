import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector, ModuleRef } from '@nestjs/core';
import { UserRole } from '../../../prisma/generated/enums.js';
import {
  ROLES_KEY,
  ROLES_EXCEPTION_KEY,
  RolesExceptionCondition,
} from '../decorators/roles.decorator.js';
import { User } from '../../user/entities/user.entity.js';
import type { Request } from 'express';
import { ErrorCode } from '../../common/enums/error-codes.enum.js';
import { STATUS_CODES } from 'node:http';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const exceptionCondition =
      this.reflector.getAllAndOverride<RolesExceptionCondition>(
        ROLES_EXCEPTION_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requiredRoles && !exceptionCondition) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as User;

    const hasRole =
      requiredRoles && requiredRoles.some((role) => user?.role === role);

    if (hasRole) return true;

    if (
      exceptionCondition &&
      (await exceptionCondition(user, request, this.moduleRef, context))
    ) {
      return true;
    }

    throw new ForbiddenException({
      statusCode: HttpStatus.FORBIDDEN,
      message: {
        key: ErrorCode.MISSING_ROLE,
        args: { roles: requiredRoles?.join(' | ') },
      },
      error: STATUS_CODES[HttpStatus.FORBIDDEN],
    });
  }
}
