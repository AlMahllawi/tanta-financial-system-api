import { Injectable, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiException } from '../../common/exceptions/api.exception.js';
import { ErrorCode } from '../../common/enums/error-codes.enum.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(err: unknown, user: unknown): TUser {
    if (err || !user)
      throw err instanceof Error
        ? err
        : new ApiException(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);

    return user as TUser;
  }
}
