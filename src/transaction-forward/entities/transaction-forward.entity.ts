import { TransactionForwardStatus } from 'prisma/generated/enums';
import { TransactionForwardModel } from 'prisma/generated/models';

export class TransactionForward implements TransactionForwardModel {
  id: number;
  status: TransactionForwardStatus;
  comment: string;
  sender: string;
  receiver: string;
  seen: boolean;
  forwardedAt: Date;
  updatedAt: Date;
  transactionId: number;
}
