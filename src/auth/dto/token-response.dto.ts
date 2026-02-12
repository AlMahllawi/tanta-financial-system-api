import { ApiProperty } from '@nestjs/swagger';

class AuthUserDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  departmentName: string;
}

export class TokenResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refresh_token: string;

  @ApiProperty({ description: 'Authenticated user info' })
  user: AuthUserDto;
}
