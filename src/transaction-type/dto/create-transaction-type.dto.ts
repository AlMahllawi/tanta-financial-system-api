import { IsName } from 'src/common/decorators/is-name';

export class CreateTransactionTypeDto {
  @IsName()
  name: string;
}
