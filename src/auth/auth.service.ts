import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service.js';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { verify } from 'argon2';
import { JwtPayload } from './interfaces/auth.interface.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiException } from '../common/exceptions/api.exception.js';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(name: string, pass: string): Promise<number | null> {
    try {
      const user = await this.userService.findUserForAuth(name);
      if (user && (await verify(user.hashedPassword, pass))) return user.id;
      return null;
    } catch {
      return null;
    }
  }

  async login(userId: number) {
    const payload: JwtPayload = {
      id: userId,
    };

    const user = await this.userService.updateLastLogin(userId);

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.generateRefreshToken(payload),
      user,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      });

      const newPayload: JwtPayload = {
        id: payload.id,
      };

      const user = await this.userService.findOne(payload.id);

      return {
        access_token: this.jwtService.sign(newPayload),
        refresh_token: this.generateRefreshToken(newPayload),
        user,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_REFRESH_TOKEN,
      );
    }
  }

  private generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.getOrThrow<
        NonNullable<JwtSignOptions['expiresIn']>
      >('REFRESH_TOKEN_EXPIRATION'),
    });
  }
}
