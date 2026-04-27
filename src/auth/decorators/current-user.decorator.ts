import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { User } from '../../user/entities/user.entity.js';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as User;

    return data ? user?.[data] : user;
  },
);
