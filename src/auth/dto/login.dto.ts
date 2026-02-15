import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { IsName } from '../../common/decorators/is-name.js';

export class LoginDto {
  @ApiProperty({ example: 'Administrator' })
  @IsName()
  name: string;

  @ApiProperty({ examples: ['Ad31n@5ecure', '5ecuredP@ssw0rd'] })
  @IsString()
  @IsNotEmpty()
  password: string;
}
