import { IsName } from '../../common/decorators/is-name.js';

export class CreateTransactionTypeDto {
  @IsName()
  name: string;
}
