import { ApiProperty } from '@nestjs/swagger';
import { TransactionPriority } from '../../../prisma/generated/enums.js';
import { TransactionModel } from '../../../prisma/generated/models.js';
import { Document } from '../../document/entities/document.entity.js';

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
  documents: Document[];
}
