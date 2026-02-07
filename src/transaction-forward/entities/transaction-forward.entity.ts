import { TransactionForwardStatus } from 'prisma/generated/enums';
import { TransactionForwardModel } from 'prisma/generated/models';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from '../../user/entities/user.entity';

export class TransactionForward implements TransactionForwardModel {
  id: number;
  @ApiProperty({ enum: TransactionForwardStatus })
  status: TransactionForwardStatus;
  senderComment: string | null;
  receiverComment: string | null;
  @Exclude()
  @ApiHideProperty()
  senderName: string;
  sender: User;
  @Exclude()
  @ApiHideProperty()
  receiverName: string;
  receiver: User;
  seen: boolean;
  forwardedAt: Date;
  updatedAt: Date;
  transactionId: number;
}
