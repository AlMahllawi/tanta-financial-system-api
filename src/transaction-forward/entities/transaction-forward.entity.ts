import { TransactionForwardStatus } from 'prisma/generated/enums';
import { TransactionForwardModel } from 'prisma/generated/models';
import { ApiProperty } from '@nestjs/swagger';

export class TransactionForward implements TransactionForwardModel {
  id: number;
  @ApiProperty({ enum: TransactionForwardStatus })
  status: TransactionForwardStatus;
  comment: string | null;
  senderName: string;
  receiverName: string;
  seen: boolean;
  forwardedAt: Date;
  updatedAt: Date;
  transactionId: number;
}
