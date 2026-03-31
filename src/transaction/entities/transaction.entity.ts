import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TransactionPriority,
  TransactionForwardStatus,
} from '../../../prisma/generated/enums.js';
import { TransactionModel } from '../../../prisma/generated/models.js';
import { Document } from '../../document/entities/document.entity.js';

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

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Only visible to admin and accountant.',
  })
  budgetName: string | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Only visible to admin and accountant.',
  })
  budgetAllocation: number | null;

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
