import { ApiProperty } from '@nestjs/swagger';

import {
  TransactionForwardStatus,
  TransactionPriority,
} from '../../../prisma/generated/enums.js';

export class TransactionSummary {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  typeName: string;

  @ApiProperty()
  fulfilled: boolean;

  @ApiProperty({ enum: TransactionPriority })
  priority: TransactionPriority;

  @ApiProperty({ enum: TransactionForwardStatus, required: false })
  lastForwardStatus?: TransactionForwardStatus;

  @ApiProperty()
  documentsCount: number;
}
