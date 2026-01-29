import { ApiProperty } from '@nestjs/swagger';
import { TransactionPriority } from 'prisma/generated/enums';
import { TransactionModel } from 'prisma/generated/models';

export class Transaction implements TransactionModel {
  id: number;
  title: string;
  description: string;
  type: string;
  fulfilled: boolean;
  @ApiProperty({ enum: TransactionPriority })
  priority: TransactionPriority;
  creator: string;
  createdAt: Date;
}
