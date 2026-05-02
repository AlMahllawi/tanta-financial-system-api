import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';

import { TransactionForwardStatus } from '../../../prisma/generated/enums.js';
import { TransactionForwardModel } from '../../../prisma/generated/models.js';
import { User } from '../../user/entities/user.entity.js';

export class TransactionForward implements TransactionForwardModel {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: TransactionForwardStatus })
  status: TransactionForwardStatus;

  @ApiProperty({ type: String, nullable: true })
  senderComment: string | null;

  @ApiProperty({ type: String, nullable: true })
  receiverComment: string | null;

  @Exclude()
  @ApiHideProperty()
  senderId: number;

  @ApiProperty({ type: () => User })
  @Type(() => User)
  sender: User;

  @Exclude()
  @ApiHideProperty()
  receiverId: number;

  @ApiProperty({ type: () => User })
  @Type(() => User)
  receiver: User;

  @ApiProperty()
  senderSeen: boolean;

  @ApiProperty({ type: Date, nullable: true })
  senderSeenAt: Date | null;

  @ApiProperty()
  receiverSeen: boolean;

  @ApiProperty({ type: Date, nullable: true })
  receiverSeenAt: Date | null;

  @ApiProperty()
  forwardedAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  transactionId: number;
}
