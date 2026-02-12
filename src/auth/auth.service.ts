import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service.js';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { verify } from 'argon2';
import { AuthenticatedUser, JwtPayload } from './interfaces/auth.interface.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(
    name: string,
    pass: string,
  ): Promise<AuthenticatedUser | null> {
    try {
      const user = await this.userService.findUserForAuth(name);
      if (user && (await verify(user.hashedPassword, pass))) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hashedPassword, ...result } = user;
        return result as AuthenticatedUser;
      }
      return null;
    } catch {
      return null;
    }
  }

  login(user: AuthenticatedUser) {
    const payload: JwtPayload = {
      name: user.name,
      role: user.role,
      department: user.departmentName,
    };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.generateRefreshToken(payload),
      user,
    };
  }

  refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      });

      const newPayload: JwtPayload = {
        name: payload.name,
        role: payload.role,
        department: payload.department,
      };

      return {
        access_token: this.jwtService.sign(newPayload),
        refresh_token: this.generateRefreshToken(newPayload),
        user: {
          name: payload.name,
          role: payload.role,
          departmentName: payload.department,
        },
      };
    } catch {
      throw new UnauthorizedException({
        statusCode: 401,
        message: { key: ErrorCode.INVALID_REFRESH_TOKEN },
        error: 'Invalid or expired refresh token',
      });
    }
  }

  private generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      expiresIn:
        this.configService.get<NonNullable<JwtSignOptions['expiresIn']>>(
          'REFRESH_TOKEN_EXPIRATION',
        ) ?? ('7d' as NonNullable<JwtSignOptions['expiresIn']>),
    });
  }
}
