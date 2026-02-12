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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiResponses } from '../common/decorators/http.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: TokenResponseDto,
      description: 'Return JWT access token',
    },
    {
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid credentials',
      errorCode: ErrorCode.INVALID_CREDENTIALS,
    },
  )
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.name,
      loginDto.password,
    );
    if (!user)
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: { key: ErrorCode.INVALID_CREDENTIALS },
        error: 'Invalid credentials',
      });
    return this.authService.login(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: TokenResponseDto,
      description: 'Return new JWT access and refresh tokens',
    },
    {
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid credentials',
      errorCode: ErrorCode.INVALID_CREDENTIALS,
    },
  )
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }
}
