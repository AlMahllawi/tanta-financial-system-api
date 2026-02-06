import { ApiProperty } from '@nestjs/swagger';
import { TransactionPriority } from 'prisma/generated/enums';
import { TransactionModel } from 'prisma/generated/models';

export class Transaction implements TransactionModel {
  id: number;
  title: string;
  description: string;
  typeName: string;
  fulfilled: boolean;
  @ApiProperty({ enum: TransactionPriority })
  priority: TransactionPriority;
  creatorName: string;
  createdAt: Date;
}
