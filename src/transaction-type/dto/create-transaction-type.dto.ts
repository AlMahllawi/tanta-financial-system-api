import { IsName } from 'src/common/decorators';

export class CreateTransactionTypeDto {
  @IsName()
  name: string;
}
