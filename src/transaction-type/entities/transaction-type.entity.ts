import { ApiProperty } from '@nestjs/swagger';
import { TransactionTypeModel } from '../../../prisma/generated/models.js';

export class TransactionType implements TransactionTypeModel {
  @ApiProperty()
  name: string;

  @ApiProperty()
  creatorId: number;
}
