import { TransactionForwardStatus } from '../../../prisma/generated/enums.js';
import { TransactionForwardModel } from '../../../prisma/generated/models.js';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from '../../user/entities/user.entity.js';

export class TransactionForward implements TransactionForwardModel {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: TransactionForwardStatus })
  status: TransactionForwardStatus;

  @ApiProperty({ nullable: true })
  senderComment: string | null;

  @ApiProperty({ nullable: true })
  receiverComment: string | null;

  @Exclude()
  @ApiHideProperty()
  senderId: number;

  @ApiProperty({ type: () => User })
  sender: User;

  @Exclude()
  @ApiHideProperty()
  receiverId: number;

  @ApiProperty({ type: () => User })
  receiver: User;

  @ApiProperty()
  senderSeen: boolean;

  @ApiProperty()
  receiverSeen: boolean;

  @ApiProperty()
  forwardedAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  transactionId: number;
}
