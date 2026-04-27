import { ApiProperty } from '@nestjs/swagger';

import { IsName } from '../../common/decorators/is-name.js';

export class CreateTransactionTypeDto {
  @ApiProperty()
  @IsName()
  name: string;
}
