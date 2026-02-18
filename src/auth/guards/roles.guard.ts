import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../prisma/generated/enums.js';
import { ROLES_KEY } from '../../common/decorators/roles.decorator.js';
import { User } from '../../user/entities/user.entity.js';
import type { Request } from 'express';
import { ErrorCode } from '../../common/enums/error-codes.enum.js';
import { STATUS_CODES } from 'node:http';
import { ALLOW_SELF_KEY } from '../../common/decorators/allow-self.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const allowSelfParam = this.reflector.getAllAndOverride<string>(
      ALLOW_SELF_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !allowSelfParam) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as User;

    const hasRole =
      requiredRoles && requiredRoles.some((role) => user?.role === role);

    if (hasRole) return true;

    if (
      allowSelfParam &&
      user &&
      request.params[allowSelfParam] &&
      user.id === Number(request.params[allowSelfParam])
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
