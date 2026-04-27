import { ApiProperty } from '@nestjs/swagger';

import { User } from '../../user/entities/user.entity.js';

export class TokenResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refresh_token: string;

  @ApiProperty({ description: 'Authenticated user info', type: User })
  user: User;
}
