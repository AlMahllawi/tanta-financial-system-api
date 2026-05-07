import {
  ClassSerializerInterceptor,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClassTransformOptions } from 'class-transformer';

@Injectable()
export class RoleSerializerInterceptor extends ClassSerializerInterceptor {
  constructor(protected readonly reflector: Reflector) {
    super(reflector);
  }

  getContextOptions(
    context: ExecutionContext,
  ): ClassTransformOptions | undefined {
    const request = context.switchToHttp().getRequest<{
      user?: { role: string };
    }>();
    const user = request.user;

    if (user?.role)
      return {
        groups: [user.role],
      };

    return {};
  }
}
