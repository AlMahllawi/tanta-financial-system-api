import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { IsName } from '../../common/decorators/is-name.js';

export class LoginDto {
  @ApiProperty()
  @IsName()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
