import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { TokenResponseDto } from './dto/token-response.dto.js';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiErrorResponses } from '../common/decorators/api-error.decorator.js';
import { PrismaExceptionFilter } from '../prisma/filters/exception.filter.js';
import { ApiException } from '../common/exceptions/api.exception.js';

@ApiTags('Authentication')
@UseFilters(PrismaExceptionFilter)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiOkResponse({
    type: TokenResponseDto,
    description: 'Return JWT access token',
  })
  @ApiErrorResponses({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
    errorCode: ErrorCode.INVALID_CREDENTIALS,
  })
  async login(@Body() loginDto: LoginDto) {
    const userId = await this.authService.validateUser(
      loginDto.name,
      loginDto.password,
    );
    if (!userId)
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS,
      );
    return this.authService.login(userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({
    type: TokenResponseDto,
    description: 'Return new JWT access and refresh tokens',
  })
  @ApiErrorResponses({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
    errorCode: ErrorCode.INVALID_REFRESH_TOKEN,
  })
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }
}
