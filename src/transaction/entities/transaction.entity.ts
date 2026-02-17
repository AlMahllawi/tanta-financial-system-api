import { ApiProperty } from '@nestjs/swagger';
import { TransactionPriority } from '../../../prisma/generated/enums.js';
import { TransactionModel } from '../../../prisma/generated/models.js';
import { Document } from '../../document/entities/document.entity.js';
import { TransactionForwardStatus } from '../../../prisma/generated/enums.js';

export class Transaction implements TransactionModel {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  typeName: string;

  @ApiProperty()
  fulfilled: boolean;

  @ApiProperty({ enum: TransactionPriority })
  priority: TransactionPriority;

  @ApiProperty({ enum: TransactionForwardStatus, required: false })
  lastForwardStatus?: TransactionForwardStatus;

  @ApiProperty()
  creatorId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: () => [Document] })
  documents: Document[];
}
