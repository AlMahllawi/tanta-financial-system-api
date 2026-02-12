import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { TokenResponseDto } from './dto/token-response.dto.js';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiExceptionResponse } from '../common/dto/http-exception.dto.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiOkResponse({
    type: TokenResponseDto,
    description: 'Return JWT access and refresh tokens',
  })
  @ApiUnauthorizedResponse({
    type: ApiExceptionResponse(
      401,
      'Invalid credentials',
      ErrorCode.INVALID_CREDENTIALS,
    ),
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.name,
      loginDto.password,
    );
    if (!user)
      throw new UnauthorizedException({
        statusCode: 401,
        message: { key: ErrorCode.INVALID_CREDENTIALS },
        error: 'Invalid credentials',
      });
    return this.authService.login(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({
    type: TokenResponseDto,
    description: 'Return new JWT access and refresh tokens',
  })
  @ApiUnauthorizedResponse({
    type: ApiExceptionResponse(
      401,
      'Invalid or expired refresh token',
      ErrorCode.INVALID_REFRESH_TOKEN,
    ),
    description: 'Invalid or expired refresh token',
  })
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }
}
